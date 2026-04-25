import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Package, ShoppingCart, BarChart3, ToggleLeft, ToggleRight,
  Coffee, TrendingUp, Hash, ExternalLink, Clock, User, MapPin, ImagePlus
} from "lucide-react";
import { toast } from "sonner";

export default function ButlerAdmin() {
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "stats">("products");

  const { data: categories } = trpc.products.categories.useQuery();
  const { data: products, refetch: refetchProducts } = trpc.products.list.useQuery({});
  const { data: orders } = trpc.kioskOrders.list.useQuery({});
  const { data: stats } = trpc.products.stats.useQuery();
  const { data: orderStats } = trpc.kioskOrders.stats.useQuery({});

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Product updated");
    },
  });

  const [bulkUpdating, setBulkUpdating] = useState(false);
  const runBulkUpdate = async (updates: { id: number; imageUrl: string }[]) => {
    setBulkUpdating(true);
    try {
      const resp = await fetch("/api/trpc/products.bulkUpdateImages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { updates } }),
      });
      const data = await resp.json();
      if (data?.result?.data?.json?.success) {
        refetchProducts();
        toast.success(`Updated ${data.result.data.json.updated} product images`);
      } else {
        toast.error("Failed to update images");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBulkUpdating(false);
    }
  };

  const tabs = [
    { id: "products" as const, label: "Products", icon: Package },
    { id: "orders" as const, label: "Orders", icon: ShoppingCart },
    { id: "stats" as const, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-2">Butler Management</p>
          <h1 className="text-3xl font-extralight text-white">Product Catalog &amp; Orders</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const missingImages = (products || []).filter((p: { id: number; imageUrl: string | null }) => !p.imageUrl || !p.imageUrl.trim());
              if (missingImages.length === 0) {
                toast.info("All products already have images");
                return;
              }
              // Import the image map and apply
              const imageMap: Record<number, string> = {
                439: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/uiensoep-7L85Jy77iUkbadcjG86Rr3.webp",
                440: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/knolselderij-soep-ZdnfjPqXddDKEGi6SP7bzb.webp",
                441: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bospaddenstoelensoep-iox2mKyfhyViixS3nELTrG.webp",
                442: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/pompoensoep-3ZTFNw7Pnqm6EbN9e83ZcZ.webp",
                443: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/linzensoep-AEctgavf5cnWZ6MXTCiVhu.webp",
                444: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/courgettesoep-WLVvjtjCZATiFNAKzrBX7B.webp",
                445: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/zoete-aardappelsoep-HRXa8wSMwNQDmk6nQsEGQE.webp",
                463: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/croissant-RqxHzbSLv5eEVbgpUB52Lw.webp",
                466: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/cinnamon-swirl-ESsymTeJixsV4j9aQTgVto.webp",
                467: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/hand-fruit-EETK5xqWxbmxDCAUcyW6wM.webp",
                468: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/plaatcake-9ic7ECsfFjNz6muUYbpaah.webp",
                469: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/koek-cAA3mpFCMHRk9fdaVGnZq5.webp",
                470: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/brownie-GEY7feSKLKHwTdsScNfTmz.webp",
                471: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bananenbrood-YRGcshFo4JA4QWEDKhbfec.webp",
                472: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/muffin-hVAiKs4hFXSpHXuSWvAXZc.webp",
                473: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/muesli-date-bar-WaiNDSZm6PVXvMJwhH7ZMA.webp",
                474: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bread-pudding-SSPjXkDoZ9hkALYdBLXKg5.webp",
                475: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/green-machine-Z3LKyfHcz547Fouaskhy3W.webp",
                476: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/yellow-star-kKSexS28Bhd8APrMRqQUNF.webp",
                477: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/red-devil-NiG3gVgjSLs49di9HXy3YQ.webp",
                478: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/pearfect-fall-hRw7MtoGzZaWbBwJ6FNb8Z.webp",
                479: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/pumpkin-spice-UCabD3MT8kcPcywXkjfumi.webp",
                480: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/americano-GZzNjKr7speH2a2rrYBy3P.webp",
                481: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/espresso-M26JnrYamxRNGbLeJgfjet.webp",
                482: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/cappuccino-gCkxgZS4yUEGywMwhAHb89.webp",
                483: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/koffie-verkeerd-PcNm7KMsi8bKBpV5iRi9g2.webp",
                484: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/latte-macchiato-NhcUkD5qciyu2dniHaomRo.webp",
                485: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/thee-byyBAvJGkaKbVKafG7kDyD.webp",
                486: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/warme-chocolademelk-7NuZHh3TUJ4JTVDg9S5vGy.webp",
                487: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/fritz-cola-PkjQiEgBrzdhfgoGCHciVe.webp",
                488: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bos-ice-tea-SoqtFQjEx8srTWWiyChzn5.webp",
                489: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/fever-tree-tonic-iMuZeYvzmZmQ2sYTHA8eo9.webp",
                490: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/sinaasappelsap-QhJJ3wB5nrRqBwo2EYpvWB.webp",
                491: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bundaberg-gingerbeer-muBi7giUEapxZoQqhj8YbF.webp",
                492: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/soof-iX3ivbQgh2Jc3sbkXZ5tgy.webp",
                493: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/kombucha-aZubdDWuqGLVCZBnfj5Yi6.webp",
                494: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/earth-water-kEN7pzU8Whw7mfb3WMLcoU.webp",
                495: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bier-36HKrxGu83FG9sXG3NoyjL.webp",
                496: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/wijn-glas-k345uYu4WPiKPaATcDnMRT.webp",
                497: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/wijn-fles-SgxFDgXjpgGp24oxG2spxp.webp",
                498: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/breakfast-deal-8aKaC4p5h9ighKbe3qTJGH.webp",
                499: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/breakfast-deal-8aKaC4p5h9ighKbe3qTJGH.webp",
                500: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/lunch-deal-JwHrYrezz9JBW7ngbdXBks.webp",
                501: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/koffie-thee-water-ec8oZoXvKqqRpy3oS6rfWo.webp",
                502: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/koffie-thee-water-ec8oZoXvKqqRpy3oS6rfWo.webp",
                503: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/afternoon-bites-brood-hRR7RZYHqK3pjZZpyh53yv.webp",
                504: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/afternoon-bites-crudite-EPteL2otN9QyLXVy8gUmv6.webp",
                505: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/borrel-bites-83kQWF2o78ZPRpxSKpiiwK.webp",
                506: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/dinner-deal-dniLa7sJXkS9A5xmdsqHSc.webp",
                507: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/borrelplank-iTCDgxMYB6Y6igz5u4rq5F.webp",
              };
              const updates = missingImages
                .filter((p: { id: number }) => imageMap[p.id])
                .map((p: { id: number }) => ({ id: p.id, imageUrl: imageMap[p.id] }));
              if (updates.length === 0) {
                toast.info("No matching images found for products without photos");
                return;
              }
              toast.info(`Updating ${updates.length} product images...`);
              runBulkUpdate(updates);
            }}
            disabled={bulkUpdating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            <ImagePlus className="w-4 h-4" />
            {bulkUpdating ? "Updating..." : "Apply AI Photos"}
          </button>
          <a
            href="/butler"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C4B89E] text-white text-sm hover:bg-[#C4B89E]/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Kiosk
          </a>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Products", value: stats?.totalProducts || 0, icon: Package, color: "#C4B89E" },
          { label: "Categories", value: stats?.totalCategories || 0, icon: Hash, color: "#C4B89E" },
          { label: "Total Orders", value: orderStats?.totalOrders || 0, icon: ShoppingCart, color: "#C4B89E" },
          { label: "Revenue", value: `€${orderStats?.totalRevenue || "0"}`, icon: TrendingUp, color: "#C4B89E" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
              activeTab === tab.id ? "bg-[#C4B89E] text-white" : "text-white/50 hover:text-white/70"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products tab */}
      {activeTab === "products" && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Product</th>
                <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Category</th>
                <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Credits</th>
                <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">EUR</th>
                <th className="text-center px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Add-on</th>
                <th className="text-center px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product: any) => {
                const category = categories?.find((c: any) => c.id === product.categoryId);
                return (
                  <tr key={product.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                          <Coffee className="w-4 h-4 text-white/30" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-white/30 text-xs truncate max-w-[200px]">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-white/50 text-sm">{category?.name || "-"}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[#C4B89E] text-sm font-medium">{product.priceCredits as string}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-white/50 text-sm">€{product.priceEur as string}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {product.isBookingAddon ? (
                        <span className="text-[#C4B89E] text-xs bg-[#C4B89E]/10 px-2 py-0.5 rounded">Yes</span>
                      ) : (
                        <span className="text-white/20 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => updateProduct.mutate({ id: product.id, isActive: !product.isActive })}
                        className="transition-colors"
                      >
                        {product.isActive ? (
                          <ToggleRight className="w-5 h-5 text-[#C4B89E]" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-white/20" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!products || products.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <Package className="w-12 h-12 mb-4" />
              <p>No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Orders tab */}
      {activeTab === "orders" && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Order #</th>
                <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Payment</th>
                <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Credits</th>
                <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">EUR</th>
                <th className="text-center px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Status</th>
                <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order: any) => (
                <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-[#C4B89E] text-sm font-mono">{order.orderNumber}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-white/50 text-sm capitalize">{order.paymentMethod?.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-white text-sm">{order.totalCredits as string}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-white/50 text-sm">€{order.totalEur as string}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      order.status === "completed" ? "text-[#C4B89E] bg-[#C4B89E]/10" :
                      order.status === "pending" ? "text-[#C4B89E] bg-[#C4B89E]/10" :
                      "text-white/30 bg-white/[0.04]"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-white/30 text-xs">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("nl-NL") : "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!orders || orders.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <ShoppingCart className="w-12 h-12 mb-4" />
              <p>No orders yet</p>
            </div>
          )}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C4B89E]" />
              Today
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Orders</span>
                <span className="text-white text-lg font-semibold">{orderStats?.todayOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Revenue</span>
                <span className="text-[#C4B89E] text-lg font-semibold">€{orderStats?.todayRevenue || "0"}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C4B89E]" />
              All Time
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Total Orders</span>
                <span className="text-white text-lg font-semibold">{orderStats?.totalOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Total Revenue</span>
                <span className="text-[#C4B89E] text-lg font-semibold">€{orderStats?.totalRevenue || "0"}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 col-span-2">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C4B89E]" />
              Products by Category
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {categories?.map((cat: any) => {
                const count = products?.filter((p: any) => p.categoryId === cat.id).length || 0;
                return (
                  <div key={cat.id} className="bg-white/[0.03] rounded-lg p-4">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{cat.name}</p>
                    <p className="text-white text-xl font-semibold">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
