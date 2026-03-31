import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Calendar, MapPin, Cpu, Wifi, TrendingUp, CreditCard } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: deviceStats } = trpc.devices.stats.useQuery();

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { label: "Companies", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-chart-3" },
    { label: "Bookings", value: stats?.totalBookings ?? 0, icon: Calendar, color: "text-chart-1" },
    { label: "Resources", value: stats?.totalResources ?? 0, icon: MapPin, color: "text-chart-2" },
    { label: "Devices", value: stats?.totalDevices ?? 0, icon: Cpu, color: "text-chart-4" },
    { label: "Online", value: stats?.devicesOnline ?? 0, icon: Wifi, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back{user?.name ? `, ${user.name}` : ""}. Here's your NET OS overview.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : s.value.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Credit Economy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Active Subscriptions", value: "312", change: "+12%" },
                { label: "Monthly Credit Volume", value: "48,600 cr", change: "+8%" },
                { label: "Breakage Revenue", value: "€4,230", change: "+15%" },
                { label: "Avg. Credits/User", value: "156 cr", change: "+3%" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                    <span className="text-xs text-primary">{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Location Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Apeldoorn", occupancy: 78, revenue: "€12,400" },
                { name: "Amsterdam", occupancy: 92, revenue: "€18,200" },
                { name: "Zwolle", occupancy: 65, revenue: "€8,900" },
                { name: "Rotterdam", occupancy: 71, revenue: "€10,100" },
                { name: "Klarenbeek", occupancy: 58, revenue: "€7,200" },
                { name: "Ede", occupancy: 45, revenue: "€5,800" },
                { name: "Spijkenisse", occupancy: 42, revenue: "€4,600" },
              ].map((loc) => (
                <div key={loc.name} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">{loc.name}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${loc.occupancy}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{loc.occupancy}%</span>
                  <span className="text-xs font-medium text-foreground w-16 text-right">{loc.revenue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Device Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="text-3xl font-bold text-foreground">{deviceStats?.online ?? 0}</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold text-destructive">{deviceStats?.offline ?? 0}</div>
                <div className="text-xs text-muted-foreground">Offline</div>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${deviceStats ? (Number(deviceStats.online) / Number(deviceStats.total)) * 100 : 0}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {deviceStats ? ((Number(deviceStats.online) / Number(deviceStats.total)) * 100).toFixed(1) : 0}% uptime
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Top Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "MEWS GLOBAL", members: 177, tier: "Gold" },
                { name: "Team Rockstars IT", members: 138, tier: "Gold" },
                { name: "Net OS", members: 133, tier: "Gold" },
                { name: "thyssenkrupp", members: 71, tier: "Silver" },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.members} members</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.tier === "Gold" ? "bg-chart-3/20 text-chart-3" : "bg-muted text-muted-foreground"
                  }`}>
                    {c.tier}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "New Booking", icon: Calendar, href: "/bookings" },
                { label: "Invite Visitor", icon: Users, href: "/visitors" },
                { label: "Credit Top-up", icon: CreditCard, href: "/wallet" },
                { label: "View Locations", icon: MapPin, href: "/locations" },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <action.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{action.label}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
