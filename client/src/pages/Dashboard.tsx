import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND } from "@/lib/brand";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { MapPin, Calendar, CreditCard, Building2, Users, ArrowRight, Clock } from "lucide-react";
import { useLocation, Link } from "wouter";

const CHART_COLORS = ["#627653", "#b8a472", "#888888", "#3a4a34"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: locationStats } = trpc.dashboard.locationStats.useQuery();
  const { data: bookingsByDay } = trpc.dashboard.bookingsByDay.useQuery();
  const { data: resourceDist } = trpc.dashboard.resourceDistribution.useQuery();
  const { data: recentBookings } = trpc.dashboard.recentBookings.useQuery({ limit: 8 });
  const { data: myWallets } = trpc.wallets.mine.useQuery();

  const personalWallet = myWallets?.find((w: any) => w.type === "personal");
  const companyWallet = myWallets?.find((w: any) => w.type === "company");
  const firstName = user?.name?.split(" ")[0] || "there";

  const bookingChartData = bookingsByDay?.map((d: any) => ({
    day: DAY_NAMES[(d.dayOfWeek - 1) % 7] || "?",
    bookings: d.count,
  })) ?? [];

  const pieData = resourceDist?.map((r: any) => ({
    name: r.type.replace("_", " "),
    value: r.count,
  })) ?? [];

  if (statsLoading) {
    return <div className="space-y-6 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <div className="space-y-8 p-1">
      {/* Welcome header with background image */}
      <div className="relative overflow-hidden -m-6 mb-0 p-8 md:p-12" style={{ background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)" }}>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <img src={BRAND.images.amsterdam} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-4">Dashboard</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Welcome back, <strong className="font-semibold">{firstName}.</strong>
          </h1>
          <p className="text-[13px] text-[#888] font-light mt-2 max-w-md">
            Your workspace overview across all Mr. Green locations.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Total Bookings", value: stats?.totalBookings ?? 0, icon: Calendar, color: "#627653" },
          { label: "Active Companies", value: stats?.totalCompanies ?? 0, icon: Building2, color: "#b8a472" },
          { label: "Total Members", value: stats?.totalUsers ?? 0, icon: Users, color: "#888" },
          { label: "Resources", value: stats?.totalResources ?? 0, icon: MapPin, color: "#627653" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] p-6">
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              <span className="text-[10px] font-medium tracking-[2px] uppercase text-[#888]">{kpi.label}</span>
            </div>
            <div className="text-[clamp(28px,3vw,40px)] font-extralight tracking-[-1px]">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.04]">
        <div className="bg-[#111] p-6 border-l-2 border-[#627653]">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Personal Credits</div>
          <div className="text-3xl font-extralight">{personalWallet ? parseFloat(personalWallet.balance).toFixed(0) : "0"}<span className="text-sm text-[#888] ml-1">credits</span></div>
          <button onClick={() => setLocation("/wallet")} className="text-[10px] text-[#627653] tracking-[2px] uppercase mt-3 flex items-center gap-1 hover:gap-2 transition-all">
            Manage <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-[#111] p-6 border-l-2 border-[#b8a472]">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Company Credits</div>
          <div className="text-3xl font-extralight">{companyWallet ? parseFloat(companyWallet.balance).toFixed(0) : "0"}<span className="text-sm text-[#888] ml-1">credits</span></div>
          <button onClick={() => setLocation("/wallet")} className="text-[10px] text-[#b8a472] tracking-[2px] uppercase mt-3 flex items-center gap-1 hover:gap-2 transition-all">
            Manage <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-6">
            <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Analytics</div>
            <h3 className="text-lg font-extralight mb-6">Booking <strong className="font-semibold">trend</strong></h3>
            <div className="h-48">
              {bookingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingChartData}>
                    <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, fontSize: 12, color: "#fff" }} />
                    <Bar dataKey="bookings" fill="#627653" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#888] text-sm font-light">No booking data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-6">
            <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Resources</div>
            <h3 className="text-lg font-extralight mb-6">Type <strong className="font-semibold">distribution</strong></h3>
            <div className="h-48 flex items-center">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                        {pieData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, fontSize: 12, color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 min-w-[120px]">
                    {pieData.map((rs: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[11px] text-[#888] capitalize">{rs.name}</span>
                        <span className="text-[11px] font-medium ml-auto">{rs.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[#888] text-sm font-light">No data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location performance */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Performance</div>
          <h3 className="text-lg font-extralight mb-6">Location <strong className="font-semibold">overview</strong></h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Location", "City", "Resources", "Bookings", "Revenue", "Occupancy"].map((h) => (
                    <th key={h} className={`text-[10px] text-[#888] tracking-[2px] uppercase font-medium pb-3 ${h === "Location" || h === "City" ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locationStats?.map((loc: any) => (
                  <tr key={loc.locationId} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-sm font-light">{loc.locationName}</td>
                    <td className="py-3 text-sm text-[#888]">{loc.city}</td>
                    <td className="py-3 text-sm text-right text-[#888]">{loc.totalResources}</td>
                    <td className="py-3 text-sm text-right text-[#888]">{loc.totalBookings}</td>
                    <td className="py-3 text-sm text-right font-medium text-[#627653]">{Number(loc.totalRevenue).toFixed(0)}c</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-[#627653] rounded-full" style={{ width: `${loc.occupancyRate}%` }} />
                        </div>
                        <span className="text-[11px] text-[#888] w-8">{loc.occupancyRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent bookings */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Activity</div>
              <h3 className="text-lg font-extralight">Recent <strong className="font-semibold">bookings</strong></h3>
            </div>
            <button onClick={() => setLocation("/bookings")} className="text-[10px] text-[#627653] tracking-[2px] uppercase flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-0">
            {(recentBookings ?? []).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
                <p className="text-sm text-[#888] font-light">No bookings yet. <Link href="/locations" className="text-[#627653] hover:underline">Book your first space</Link></p>
              </div>
            ) : (
              (recentBookings ?? []).map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#627653]/10 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-[#627653]" />
                    </div>
                    <div>
                      <p className="text-sm font-light">{b.resourceName || "Resource"}</p>
                      <p className="text-[11px] text-[#888]">{b.locationName || "Location"} &middot; {b.userName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#627653]">{parseFloat(b.creditsCost || 0).toFixed(1)}c</p>
                    <p className="text-[11px] text-[#888]">{new Date(b.startTime).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
