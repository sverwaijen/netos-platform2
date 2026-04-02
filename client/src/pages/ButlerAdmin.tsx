import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Package, ShoppingCart, BarChart3, ToggleLeft, ToggleRight,
  Coffee, TrendingUp, Hash, ExternalLink, Clock, User, MapPin
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
          <p className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-2">Butler Management</p>
          <h1 className="text-3xl font-extralight text-white">Product Catalog &amp; Orders</h1>
        </div>
        <a
          href="/butler"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#627653] text-white text-sm hover:bg-[#627653]/80 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Kiosk
        </a>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Products", value: stats?.totalProducts || 0, icon: Package, color: "#627653" },
          { label: "Categories", value: stats?.totalCategories || 0, icon: Hash, color: "#b8a472" },
          { label: "Total Orders", value: orderStats?.totalOrders || 0, icon: ShoppingCart, color: "#627653" },
          { label: "Revenue", value: `€${orderStats?.totalRevenue || "0"}`, icon: TrendingUp, color: "#b8a472" },
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
              activeTab === tab.id ? "bg-[#627653] text-white" : "text-white/50 hover:text-white/70"
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
              {products?.map((product) => {
                const category = categories?.find((c) => c.id === product.categoryId);
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
                      <span className="text-[#b8a472] text-sm font-medium">{product.priceCredits as string}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-white/50 text-sm">€{product.priceEur as string}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {product.isBookingAddon ? (
                        <span className="text-[#627653] text-xs bg-[#627653]/10 px-2 py-0.5 rounded">Yes</span>
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
                          <ToggleRight className="w-5 h-5 text-[#627653]" />
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
              {orders?.map((order) => (
                <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-[#b8a472] text-sm font-mono">{order.orderNumber}</span>
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
                      order.status === "completed" ? "text-[#627653] bg-[#627653]/10" :
                      order.status === "pending" ? "text-[#b8a472] bg-[#b8a472]/10" :
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
              <Clock className="w-4 h-4 text-[#627653]" />
              Today
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Orders</span>
                <span className="text-white text-lg font-semibold">{orderStats?.todayOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Revenue</span>
                <span className="text-[#b8a472] text-lg font-semibold">€{orderStats?.todayRevenue || "0"}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#b8a472]" />
              All Time
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Total Orders</span>
                <span className="text-white text-lg font-semibold">{orderStats?.totalOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Total Revenue</span>
                <span className="text-[#b8a472] text-lg font-semibold">€{orderStats?.totalRevenue || "0"}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 col-span-2">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#627653]" />
              Products by Category
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {categories?.map((cat) => {
                const count = products?.filter((p) => p.categoryId === cat.id).length || 0;
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
