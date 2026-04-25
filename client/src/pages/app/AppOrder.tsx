import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import {
  ChevronLeft, Coffee, ShoppingCart, Plus, Minus, Check,
  MapPin, Clock, CreditCard, Loader2,
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

export default function AppOrder() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const bookingId = params.get("bookingId") ? parseInt(params.get("bookingId")!) : undefined;
  const locationId = params.get("locationId") ? parseInt(params.get("locationId")!) : 1;
  const resourceName = params.get("resource") || "Ruimte";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; totalCredits: string } | null>(null);

  const { data: categories } = trpc.products.categories.useQuery();
  const { data: allProducts } = trpc.products.list.useQuery({});
  const { data: wallets } = trpc.wallets.mine.useQuery();
  const createOrder = trpc.kioskOrders.create.useMutation();

  const personalWallet = wallets?.find((w: any) => w.type === "personal");

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    if (!selectedCategory) return allProducts;
    return allProducts.filter((p: any) => p.categoryId === selectedCategory);
  }, [allProducts, selectedCategory]);

  const cartTotal = useMemo(() => {
    const credits = cart.reduce((sum, item) => sum + parseFloat(item.priceCredits) * item.quantity, 0);
    const eur = cart.reduce((sum, item) => sum + parseFloat(item.priceEur) * item.quantity, 0);
    return { credits: credits.toFixed(2), eur: eur.toFixed(2), count: cart.reduce((s, i) => s + i.quantity, 0) };
  }, [cart]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
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
      prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const handleOrder = async () => {
    if (cart.length === 0) return;
    try {
      const result = await createOrder.mutateAsync({
        locationId,
        userId: user?.id,
        bookingId,
        paymentMethod: "personal_credits",
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        notes: notes || undefined,
      });
      setOrderSuccess({ orderNumber: result.orderNumber, totalCredits: result.totalCredits });
      setCart([]);
      setShowCart(false);
    } catch (err: any) {
      toast.error(err.message || "Bestelling mislukt");
    }
  };

  // Success screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#627653] flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-light text-white mb-2">Bestelling geplaatst!</h1>
          <p className="text-[#C4B89E] text-sm tracking-wider uppercase mb-2">{orderSuccess.orderNumber}</p>
          <p className="text-white/40 text-sm mb-1">
            Wordt bezorgd bij <span className="text-white/70">{resourceName}</span>
          </p>
          <p className="text-white/60 text-lg font-medium mb-6">{parseFloat(orderSuccess.totalCredits).toFixed(0)} credits</p>
          <button
            onClick={() => navigate("/app/bookings")}
            className="px-6 py-3 rounded-xl bg-white/[0.06] text-white text-sm"
          >
            Terug naar boekingen
          </button>
        </div>
      </div>
    );
  }

  // Cart overlay
  if (showCart) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <button onClick={() => setShowCart(false)} className="text-white/50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-light text-white">Bestelling</h1>
        </div>

        {/* Delivery info */}
        <div className="px-5 py-4 bg-[#627653]/10 border-b border-[#627653]/20">
          <div className="flex items-center gap-2 text-[#627653] text-sm">
            <MapPin className="w-4 h-4" />
            <span>Bezorgen bij: <strong>{resourceName}</strong></span>
          </div>
          {bookingId && (
            <p className="text-white/30 text-xs mt-1 ml-6">Gekoppeld aan boeking #{bookingId}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3">
              <div className="w-12 h-12 rounded-lg bg-white/[0.05] overflow-hidden flex-shrink-0">
                <img
                  src={getProductImageUrl(item.name, item.imageUrl ?? undefined)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{item.name}</p>
                <p className="text-[#C4B89E] text-xs">{parseFloat(item.priceCredits).toFixed(0)}c per stuk</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, -1)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/60"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-white text-sm w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, 1)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/60"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Notes */}
          <div className="pt-2">
            <label className="text-white/40 text-xs block mb-2">Opmerkingen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijv. extra melk, geen suiker..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#627653]/50 resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Order summary & pay */}
        <div className="px-5 py-4 border-t border-white/[0.06] space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Subtotaal</span>
            <span className="text-white font-medium">{parseFloat(cartTotal.credits).toFixed(0)} credits</span>
          </div>
          {personalWallet && (
            <div className="flex justify-between text-xs">
              <span className="text-white/30">Saldo</span>
              <span className="text-white/50">{parseFloat(personalWallet.balance as string).toFixed(0)} credits</span>
            </div>
          )}
          <button
            onClick={handleOrder}
            disabled={createOrder.isPending || cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-[#627653] text-white text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {createOrder.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Betaal met credits
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Main product browsing
  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <button onClick={() => navigate("/app/bookings")} className="text-white/50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-light text-white">Bestel naar je ruimte</h1>
          <p className="text-white/30 text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {resourceName}
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b border-white/[0.04]">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            !selectedCategory ? "bg-[#627653] text-white" : "bg-white/[0.04] text-white/50"
          }`}
        >
          Alles
        </button>
        {categories?.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id ? "bg-[#627653] text-white" : "bg-white/[0.04] text-white/50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product: any) => {
            const inCart = cart.find((i) => i.productId === product.id);
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-left transition-all active:scale-[0.97]"
              >
                {inCart && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#627653] text-white text-[10px] font-bold flex items-center justify-center z-10">
                    {inCart.quantity}
                  </div>
                )}
                <div className="w-full aspect-square rounded-lg bg-white/[0.04] mb-2 overflow-hidden">
                  <img
                    src={getProductImageUrl(product.name, product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white text-xs font-medium truncate">{product.name}</p>
                <p className="text-[#C4B89E] text-[10px] mt-0.5">{parseFloat(product.priceCredits).toFixed(0)} credits</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart bar */}
      {cart.length > 0 && (
        <div className="px-5 py-3 border-t border-white/[0.06]">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-3.5 rounded-xl bg-[#627653] text-white text-sm font-medium flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <ShoppingCart className="w-4 h-4" />
            Bekijk bestelling ({cartTotal.count})
            <span className="ml-auto text-white/70">{parseFloat(cartTotal.credits).toFixed(0)}c</span>
          </button>
        </div>
      )}
    </div>
  );
}
