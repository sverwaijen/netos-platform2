import { trpc } from "@/lib/trpc";
import { useState, useMemo, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Coffee, ShoppingCart, CreditCard, Wallet, Building2, X, Plus, Minus,
  ChevronLeft, Search, Leaf, Check, QrCode, User
} from "lucide-react";
import { toast } from "sonner";
import { getProductImageUrl } from "@/lib/imageUtils";

type CartItem = {
  productId: number;
  name: string;
  priceCredits: string;
  priceEur: string;
  quantity: number;
  imageUrl?: string | null;
};

type PaymentMethod = "personal_credits" | "company_credits" | "stripe_card" | "company_invoice" | "cash";

type MemberInfo = {
  userId: number;
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  walletBalance?: number;
  balance?: string;
  walletId?: number;
};

export default function ButlerKiosk() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ orderNumber: string; totalCredits: string; totalEur: string } | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [scannedMember, setScannedMember] = useState<MemberInfo | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = trpc.products.categories.useQuery();
  const { data: allProducts } = trpc.products.list.useQuery({});
  const createOrder = trpc.kioskOrders.create.useMutation();
  const verifyQR = trpc.kioskQr.verifyMemberQR.useMutation();
  const createOrderWithMember = trpc.kioskQr.createOrderWithMember.useMutation();

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    let filtered = allProducts;
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return filtered;
  }, [allProducts, selectedCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    const credits = cart.reduce((sum, item) => sum + parseFloat(item.priceCredits) * item.quantity, 0);
    const eur = cart.reduce((sum, item) => sum + parseFloat(item.priceEur) * item.quantity, 0);
    return { credits: credits.toFixed(2), eur: eur.toFixed(2) };
  }, [cart]);

  const addToCart = (product: NonNullable<typeof allProducts>[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        priceCredits: product.priceCredits as string,
        priceEur: product.priceEur as string,
        quantity: 1,
        imageUrl: product.imageUrl,
      }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const handlePayment = async (method: PaymentMethod) => {
    try {
      // If using member QR, use special endpoint
      if (scannedMember && method === "personal_credits") {
        const result = await createOrderWithMember.mutateAsync({
          locationId: 1,
          qrData: `${scannedMember.userId}:${qrInput}`,
          paymentMethod: method,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
        setLastOrder({ orderNumber: result.orderNumber, totalCredits: result.totalCredits, totalEur: result.totalEur });
        setCart([]);
        setShowPayment(false);
        setShowSuccess(true);
        setScannedMember(null);
        setQrInput("");
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        const result = await createOrder.mutateAsync({
          locationId: 1,
          userId: user?.id,
          paymentMethod: method,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
        setLastOrder({ orderNumber: result.orderNumber, totalCredits: result.totalCredits, totalEur: result.totalEur });
        setCart([]);
        setShowPayment(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order failed";
      if (msg.includes("Insufficient balance")) {
        toast.error("Insufficient wallet balance");
      } else if (msg.includes("Invalid QR")) {
        toast.error("QR code invalid or expired");
      } else {
        toast.error(msg);
      }
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      const member = await verifyQR.mutateAsync({ qrData });
      setScannedMember({
        userId: member.userId,
        name: member.name,
        email: member.email,
        phone: member.phone,
        walletBalance: member.walletBalance,
        walletId: member.walletId,
      });
      setQrInput(qrData);
      setShowQRScanner(false);
      toast.success(`Welcome, ${member.name}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "QR scan failed";
      toast.error(msg);
      setQrInput("");
    }
  };

  const handleQRScan = async () => {
    if (!qrInput.trim()) return;

    try {
      // Extract token from QR code (format: kiosk://member/TOKEN or just TOKEN)
      const token = qrInput.includes("/") ? qrInput.split("/").pop() : qrInput;
      if (!token) {
        toast.error("Invalid QR code format");
        return;
      }

      const result = await verifyQR.mutateAsync({ token });
      if (result.success && result.user && result.wallet) {
        setScannedMember({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatarUrl: result.user.avatarUrl,
          balance: result.wallet.balance,
        });
        setQrInput("");
      } else {
        toast.error(result.reason || "Invalid QR code");
        setQrInput("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "QR scan failed");
      setQrInput("");
    }
  };

  const handleMemberPayment = async () => {
    if (!scannedMember || cart.length === 0) return;

    try {
      const token = qrInput || scannedMember.name; // Would need actual token stored
      const result = await createOrderWithMember.mutateAsync({
        token: qrInput.includes("/") ? qrInput.split("/").pop() || "" : qrInput,
        locationId: 1,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      if (result.success) {
        setLastOrder({
          orderNumber: result.order.orderNumber,
          totalCredits: result.order.totalCredits,
          totalEur: result.order.totalEur,
        });
        setCart([]);
        setScannedMember(null);
        setQrScanMode(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        toast.error(result.reason || "Order failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    }
  };

  // Category emoji map
  const categoryIcons: Record<string, string> = {
    "Coffee & Drinks": "☕",
    "Breakfast": "🥐",
    "Lunch": "🥗",
    "Snacks & Treats": "🍪",
    "Office Supplies": "📎",
    "Meeting Catering": "🍽️",
    "Wellness": "🧘",
    "Tech Accessories": "🔌",
  };

  if (showSuccess && lastOrder) {
    return (
      <div className="w-screen h-screen bg-[#111] flex items-center justify-center" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-[#627653] flex items-center justify-center mx-auto mb-8">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-extralight text-white mb-4">Order Confirmed</h1>
          <p className="text-[#b8a472] text-xl tracking-[0.2em] uppercase mb-8">{lastOrder.orderNumber}</p>
          <div className="flex gap-8 justify-center text-white/60">
            <div>
              <p className="text-sm uppercase tracking-wider mb-1">Credits</p>
              <p className="text-2xl font-semibold text-white">{lastOrder.totalCredits}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-sm uppercase tracking-wider mb-1">EUR</p>
              <p className="text-2xl font-semibold text-white">€{lastOrder.totalEur}</p>
            </div>
          </div>
          <p className="text-white/30 mt-8 text-sm">Returning to menu...</p>
        </div>
      </div>
    );
  }

  // QR Scan Mode UI
  if (qrScanMode) {
    return (
      <div className="w-screen h-screen bg-[#111] flex items-center justify-center p-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="w-full max-w-sm">
          <button
            onClick={() => setQrScanMode(false)}
            className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to menu
          </button>

          {!scannedMember ? (
            <div className="text-center">
              <div className="w-32 h-32 rounded-lg bg-white/[0.05] border-2 border-dashed border-white/[0.1] flex items-center justify-center mx-auto mb-8">
                <CreditCard className="w-12 h-12 text-white/20" />
              </div>
              <h1 className="text-3xl font-extralight text-white mb-2">Scan Member Card</h1>
              <p className="text-white/40 text-sm mb-8">Hold member card near scanner</p>

              <input
                type="text"
                placeholder="Paste QR token here"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleQRScan()}
                autoFocus
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-center placeholder:text-white/30 focus:outline-none focus:border-[#627653]/50 mb-4"
              />

              <button
                onClick={handleQRScan}
                disabled={verifyQR.isPending || !qrInput.trim()}
                className="w-full px-6 py-3 bg-[#627653] text-white rounded-lg font-medium hover:bg-[#4a5a3f] disabled:opacity-50 transition-all"
              >
                {verifyQR.isPending ? "Scanning..." : "Scan"}
              </button>
            </div>
          ) : (
            <div className="text-center">
              {scannedMember.avatarUrl && (
                <img
                  src={scannedMember.avatarUrl}
                  alt={scannedMember.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              )}
              <h2 className="text-2xl font-light text-white mb-1">{scannedMember.name}</h2>
              <p className="text-white/50 text-sm mb-6">{scannedMember.email}</p>

              <div className="bg-white/[0.05] rounded-lg p-4 mb-8 border border-white/[0.08]">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Wallet Balance</p>
                <p className="text-3xl font-semibold text-[#627653]">{scannedMember.balance}c</p>
              </div>

              {cart.length > 0 && (
                <div>
                  <div className="bg-white/[0.03] rounded-lg p-4 mb-6 border border-white/[0.08]">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-white/40 text-xs uppercase mb-1">Items</p>
                        <p className="text-lg font-semibold text-white">{cart.reduce((s, i) => s + i.quantity, 0)}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs uppercase mb-1">Total</p>
                        <p className="text-lg font-semibold text-white">{cartTotal.credits}c</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleMemberPayment}
                    disabled={createOrderWithMember.isPending}
                    className="w-full px-6 py-3 bg-[#627653] text-white rounded-lg font-medium hover:bg-[#4a5a3f] disabled:opacity-50 transition-all mb-3"
                  >
                    {createOrderWithMember.isPending ? "Processing..." : `Charge ${cartTotal.credits}c`}
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setScannedMember(null);
                  setQrInput("");
                }}
                className="w-full px-6 py-3 bg-white/[0.05] text-white rounded-lg font-medium hover:bg-white/[0.08] transition-all"
              >
                Scan Different Card
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#111] flex flex-col md:flex-row overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Left: Product catalog */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#627653] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">The Butler</h1>
              <p className="text-xs text-white/40 tracking-[0.2em] uppercase">Mr. Green Offices</p>
            </div>
          </div>
          {/* Search */}
          <div className="relative w-40 sm:w-60 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#627653]/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 md:px-8 py-3 md:py-4 flex gap-2 md:gap-3 overflow-x-auto border-b border-white/[0.04]">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              !selectedCategory
                ? "bg-[#627653] text-white"
                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
            }`}
          >
            All Items
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? "bg-[#627653] text-white"
                  : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
              }`}
            >
              <span>{categoryIcons[cat.name] || "📦"}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.productId === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-left transition-all hover:border-[#627653]/30 hover:bg-white/[0.05] active:scale-[0.98]"
                >
                  {inCart && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#627653] text-white text-xs font-bold flex items-center justify-center">
                      {inCart.quantity}
                    </div>
                  )}
                  <div className="w-full aspect-square rounded-lg bg-white/[0.04] mb-3 overflow-hidden">
                    <img
                      src={getProductImageUrl(product.imageUrl, product.name, product.category)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = getProductImageUrl(null, product.name, product.category);
                      }}
                    />
                  </div>
                  <h3 className="text-white text-sm font-medium mb-1 line-clamp-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-white/30 text-xs mb-2 line-clamp-1">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[#b8a472] text-sm font-semibold">{product.priceCredits as string} cr</span>
                    <span className="text-white/30 text-xs">€{product.priceEur as string}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-white/30">
              <Coffee className="w-12 h-12 mb-4" />
              <p className="text-lg">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & QR Scanner sidebar */}
      <div className={`${cart.length > 0 || showQRScanner || scannedMember ? 'flex' : 'hidden md:flex'} w-full md:w-[380px] bg-white/[0.02] border-t md:border-t-0 md:border-l border-white/[0.06] flex-col max-h-[50vh] md:max-h-none`}>
        {/* QR Scanner UI */}
        {showQRScanner && (
          <div className="flex-1 flex flex-col p-6 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#627653]" />
                Scan Member QR
              </h3>
              <button
                onClick={() => { setShowQRScanner(false); setQrInput(""); }}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={qrInputRef}
              type="text"
              placeholder="Scan QR code or paste data..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && qrInput) {
                  handleQRScan(qrInput);
                }
              }}
              autoFocus
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#627653]/50 mb-3"
            />
            <p className="text-xs text-white/40 text-center">Press Enter to scan or scan with camera device</p>
          </div>
        )}

        {/* Scanned Member Info */}
        {scannedMember && !showQRScanner && (
          <div className="px-6 py-4 border-b border-white/[0.06] bg-[#627653]/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#627653]" />
                <div>
                  <p className="text-white font-medium text-sm">{scannedMember.name}</p>
                  <p className="text-xs text-white/40">{scannedMember.email}</p>
                </div>
              </div>
              <button
                onClick={() => setScannedMember(null)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-2">
              <p className="text-xs text-white/50 mb-1">Wallet Balance</p>
              <p className="text-[#627653] font-semibold">{scannedMember.walletBalance.toFixed(2)} credits</p>
            </div>
          </div>
        )}

        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-[#627653]" />
          <h2 className="text-white font-semibold">Your Order</h2>
          {cart.length > 0 && (
            <span className="ml-auto text-xs text-white/40">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 px-8">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-center text-sm">Tap products to add them to your order</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[#b8a472] text-xs">{item.priceCredits} cr · €{item.priceEur}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/60 hover:bg-white/[0.12]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-white text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/60 hover:bg-white/[0.12]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart totals */}
            <div className="px-6 py-4 border-t border-white/[0.06] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">{cartTotal.credits} credits</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">EUR equivalent</span>
                <span className="text-white/60">€{cartTotal.eur}</span>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <div className="text-right">
                  <p className="text-[#b8a472] font-semibold">{cartTotal.credits} credits</p>
                  <p className="text-white/40 text-xs">€{cartTotal.eur} incl. VAT</p>
                </div>
              </div>
            </div>

            {/* Payment buttons */}
            {!showPayment ? (
              <div className="px-6 pb-6 space-y-2">
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full py-4 rounded-xl bg-[#627653] text-white font-semibold text-sm tracking-wider uppercase hover:bg-[#627653]/90 transition-all active:scale-[0.98]"
                >
                  Pay Now
                </button>
                <button
                  onClick={() => setShowQRScanner(!showQRScanner)}
                  className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-semibold text-sm tracking-wider uppercase hover:border-[#627653]/40 transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {scannedMember ? "Change Member" : "Scan Member QR"}
                </button>
                <button
                  onClick={() => setCart([])}
                  className="w-full py-2 text-white/30 text-xs hover:text-white/50 transition-colors"
                >
                  Clear Order
                </button>
              </div>
            ) : (
              <div className="px-6 pb-6 space-y-2 animate-slide-up">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex items-center gap-2 text-white/40 text-xs mb-3 hover:text-white/60"
                >
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Choose payment method</p>

                {scannedMember && (
                  <button
                    onClick={() => handlePayment("personal_credits")}
                    disabled={createOrderWithMember.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#627653]/20 border border-[#627653]/40 text-white text-sm hover:bg-[#627653]/30 transition-all"
                  >
                    <User className="w-5 h-5 text-[#627653]" />
                    <div className="text-left flex-1">
                      <p className="font-medium">{scannedMember.name}</p>
                      <p className="text-xs text-white/40">{scannedMember.walletBalance.toFixed(2)}c available</p>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => handlePayment("personal_credits")}
                  disabled={createOrder.isPending || !!scannedMember}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-white text-sm transition-all ${scannedMember ? "opacity-50 cursor-not-allowed" : "bg-white/[0.04] border-white/[0.08] hover:border-[#627653]/40"}`}
                >
                  <Wallet className="w-5 h-5 text-[#627653]" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Personal Credits</p>
                    <p className="text-xs text-white/40">Deduct from your wallet</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePayment("company_credits")}
                  disabled={createOrder.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm hover:border-[#627653]/40 transition-all"
                >
                  <Building2 className="w-5 h-5 text-[#b8a472]" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Company Account</p>
                    <p className="text-xs text-white/40">Charge to company wallet</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePayment("stripe_card")}
                  disabled={createOrder.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm hover:border-[#627653]/40 transition-all"
                >
                  <CreditCard className="w-5 h-5 text-white/60" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Card / PIN</p>
                    <p className="text-xs text-white/40">Stripe terminal payment</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePayment("company_invoice")}
                  disabled={createOrder.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm hover:border-[#627653]/40 transition-all"
                >
                  <Building2 className="w-5 h-5 text-white/40" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Invoice</p>
                    <p className="text-xs text-white/40">Add to company invoice</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowPayment(false);
                    setQrScanMode(true);
                  }}
                  disabled={createOrder.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-[#627653]/30 text-white text-sm hover:border-[#627653]/60 hover:bg-white/[0.06] transition-all"
                >
                  <CreditCard className="w-5 h-5 text-[#627653]" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Member Card (QR)</p>
                    <p className="text-xs text-white/40">Scan member QR code</p>
                  </div>
                </button>

                {createOrder.isPending && (
                  <div className="text-center text-white/40 text-xs py-2 animate-pulse">
                    Processing payment...
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
