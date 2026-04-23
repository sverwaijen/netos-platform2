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

/** Wallet record shape for dashboard display */
interface DashboardWalletRecord {
  id: number;
  type: "personal" | "company";
  balance: string;
}

/** Booking-by-day aggregation shape */
interface BookingsByDayRecord {
  dayOfWeek: number;
  count: number;
  totalCredits: number;
}

/** Resource distribution aggregation shape */
interface ResourceDistRecord {
  type: string;
  count: number;
}

/** Location stats aggregation shape */
interface LocationStatRecord {
  locationId: number;
  locationName: string;
  city: string;
  totalBookings: number;
  totalResources: number;
  totalRevenue: number;
  occupancyRate: number;
}

/** Recent booking record shape */
interface RecentBookingRecord {
  id: number;
  resourceId: number;
  locationId: number;
  startTime: number;
  endTime: number;
  status: string;
  creditsCost: string | null;
  resourceName: string;
  resourceType: string;
  locationName: string;
  userName: string;
}

/** Pie chart data point */
interface PieDataPoint {
  name: string;
  value: number;
}

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

  const personalWallet = myWallets?.find((w: DashboardWalletRecord) => w.type === "personal");
  const companyWallet = myWallets?.find((w: DashboardWalletRecord) => w.type === "company");
  const firstName = user?.name?.split(" ")[0] || "there";

  const bookingChartData = bookingsByDay?.map((d: BookingsByDayRecord) => ({
    day: DAY_NAMES[(d.dayOfWeek - 1) % 7] || "?",
    bookings: d.count,
  })) ?? [];

  const pieData = resourceDist?.map((r: ResourceDistRecord) => ({
    name: r.type.replace("_", " "),
    value: r.count,
  })) ?? [];

  if (statsLoading) {
    return <div className="space-y-6 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome header with background image */}
      <div className="relative overflow-hidden -mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-0 p-6 md:p-12" style={{ background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)" }}>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 hidden md:block">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04] -mx-4 md:mx-0">
        {[
          { label: "Total Bookings", value: stats?.totalBookings ?? 0, icon: Calendar, color: "#627653" },
          { label: "Active Companies", value: stats?.totalCompanies ?? 0, icon: Building2, color: "#b8a472" },
          { label: "Total Members", value: stats?.totalUsers ?? 0, icon: Users, color: "#888" },
          { label: "Resources", value: stats?.totalResources ?? 0, icon: MapPin, color: "#627653" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] p-4 md:p-6">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
              <kpi.icon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" style={{ color: kpi.color }} />
              <span className="text-[9px] md:text-[10px] font-medium tracking-[1.5px] md:tracking-[2px] uppercase text-[#888] truncate">{kpi.label}</span>
            </div>
            <div className="text-2xl md:text-[clamp(28px,3vw,40px)] font-extralight tracking-[-1px]">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.04] -mx-4 md:mx-0">
        <div className="bg-[#111] p-4 md:p-6 border-l-2 border-[#627653]">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Personal Credits</div>
          <div className="text-3xl font-extralight">{personalWallet ? parseFloat(personalWallet.balance).toFixed(0) : "0"}<span className="text-sm text-[#888] ml-1">credits</span></div>
          <button onClick={() => setLocation("/wallet")} className="text-[10px] text-[#627653] tracking-[2px] uppercase mt-3 flex items-center gap-1 hover:gap-2 transition-all">
            Manage <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-[#111] p-4 md:p-6 border-l-2 border-[#b8a472]">
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
            <div className="h-48 flex flex-col md:flex-row items-center">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                        {pieData.map((_: PieDataPoint, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, fontSize: 12, color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 md:space-y-2 min-w-0 md:min-w-[120px] flex flex-wrap md:flex-col gap-x-4 md:gap-x-0">
                    {pieData.map((rs: PieDataPoint, i: number) => (
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
                {locationStats?.map((loc: LocationStatRecord) => (
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
              (recentBookings ?? []).map((b: RecentBookingRecord, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#627653]/10 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-[#627653]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-light truncate">{b.resourceName || "Resource"}</p>
                      <p className="text-[11px] text-[#888] truncate">{b.locationName || "Location"} &middot; {b.userName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-[#627653]">{parseFloat(b.creditsCost || "0").toFixed(1)}c</p>
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
