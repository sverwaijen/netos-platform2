import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, Building2, CalendarDays, MapPin, Cpu, Wifi, TrendingUp,
  CreditCard, ArrowRight, Clock, Activity, BarChart3, Zap
} from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["oklch(0.75 0.18 160)", "oklch(0.65 0.2 165)", "oklch(0.82 0.12 85)", "oklch(0.55 0.15 260)", "oklch(0.65 0.22 25)", "#8b5cf6", "#f97316", "#06b6d4"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: deviceStats } = trpc.devices.stats.useQuery();
  const { data: locationStats } = trpc.dashboard.locationStats.useQuery();
  const { data: bookingsByDay } = trpc.dashboard.bookingsByDay.useQuery();
  const { data: resourceDist } = trpc.dashboard.resourceDistribution.useQuery();
  const { data: recentBookings } = trpc.dashboard.recentBookings.useQuery({ limit: 8 });
  const { data: myWallets } = trpc.wallets.mine.useQuery();

  const personalWallet = myWallets?.find((w: any) => w.type === "personal");
  const companyWallet = myWallets?.find((w: any) => w.type === "company");

  const bookingChartData = bookingsByDay?.map((d: any) => ({
    day: DAY_NAMES[(d.dayOfWeek - 1) % 7] || "?",
    bookings: d.count,
    credits: d.totalCredits,
  })) ?? [];

  const pieData = resourceDist?.map((r: any) => ({
    name: r.type.replace("_", " "),
    value: r.count,
  })) ?? [];

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening across your workspace network.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/locations"><Button variant="outline" size="sm"><MapPin className="w-4 h-4 mr-2" />Book Space</Button></Link>
          <Link href="/wallet"><Button size="sm" className="bg-primary text-primary-foreground"><CreditCard className="w-4 h-4 mr-2" />Wallet</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <KPICard icon={Users} label="Members" value={stats?.totalUsers ?? 0} color="text-blue-400" />
            <KPICard icon={Building2} label="Companies" value={stats?.totalCompanies ?? 0} color="text-purple-400" />
            <KPICard icon={CalendarDays} label="Bookings" value={stats?.totalBookings ?? 0} color="text-netos-green" />
            <KPICard icon={MapPin} label="Resources" value={stats?.totalResources ?? 0} color="text-amber-400" />
            <KPICard icon={Cpu} label="Devices" value={stats?.totalDevices ?? 0} sub={`${stats?.devicesOnline ?? 0} online`} color="text-cyan-400" />
            <KPICard icon={Wifi} label="Sensors" value={stats?.totalSensors ?? 0} sub={`${stats?.sensorsActive ?? 0} active`} color="text-rose-400" />
          </>
        )}
      </div>

      {(personalWallet || companyWallet) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalWallet && (
            <Card className="glass-card border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-netos-green/20 flex items-center justify-center"><CreditCard className="w-5 h-5 text-netos-green" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Personal Wallet</p>
                    <p className="text-xl font-bold">{parseFloat(personalWallet.balance).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">credits</span></p>
                  </div>
                </div>
                <Link href="/wallet"><Button variant="ghost" size="sm"><ArrowRight className="w-4 h-4" /></Button></Link>
              </CardContent>
            </Card>
          )}
          {companyWallet && (
            <Card className="glass-card border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-purple-400" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Company Wallet</p>
                    <p className="text-xl font-bold">{parseFloat(companyWallet.balance).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">credits</span></p>
                  </div>
                </div>
                <Link href="/wallet"><Button variant="ghost" size="sm"><ArrowRight className="w-4 h-4" /></Button></Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-netos-green" />Bookings by Day</CardTitle>
            <CardDescription>Weekly booking distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {bookingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingChartData} barSize={32}>
                  <XAxis dataKey="day" tick={{ fill: "oklch(0.65 0.015 260)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.65 0.015 260)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.19 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)" }} />
                  <Bar dataKey="bookings" fill="oklch(0.65 0.2 165)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No booking data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" />Resource Types</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.19 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-netos-green" />Location Performance</CardTitle>
          <CardDescription>Bookings, resources and occupancy per location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-2 font-medium">Location</th>
                  <th className="text-left py-2 font-medium">City</th>
                  <th className="text-right py-2 font-medium">Resources</th>
                  <th className="text-right py-2 font-medium">Bookings</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                  <th className="text-right py-2 font-medium">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {locationStats?.map((loc: any) => (
                  <tr key={loc.locationId} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="py-2.5 font-medium">{loc.locationName}</td>
                    <td className="py-2.5 text-muted-foreground">{loc.city}</td>
                    <td className="py-2.5 text-right">{loc.totalResources}</td>
                    <td className="py-2.5 text-right">{loc.totalBookings}</td>
                    <td className="py-2.5 text-right font-mono text-netos-green">{Number(loc.totalRevenue).toFixed(0)}c</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-netos-green rounded-full" style={{ width: `${loc.occupancyRate}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{loc.occupancyRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" />Recent Bookings</CardTitle>
            <CardDescription>Latest bookings across all locations</CardDescription>
          </div>
          <Link href="/bookings"><Button variant="ghost" size="sm">View all <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {recentBookings?.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Zap className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-medium">{b.resourceName}</p>
                      <p className="text-xs text-muted-foreground">{b.locationName} · {b.userName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-netos-green">{parseFloat(b.creditsCost).toFixed(1)}c</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.startTime).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))}
              {(!recentBookings || recentBookings.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">No bookings yet. <Link href="/locations" className="text-primary hover:underline">Book your first space</Link></div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number; sub?: string; color: string }) {
  return (
    <Card className="glass-card border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
