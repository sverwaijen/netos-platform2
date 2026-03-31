import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, TrendingUp, Users, CreditCard, Calendar, Info } from "lucide-react";

const typeIcons: Record<string, any> = {
  enterprise_signup: Users,
  breakage_milestone: TrendingUp,
  occupancy_anomaly: AlertTriangle,
  credit_inflation: CreditCard,
  monthly_report: Calendar,
  booking_reminder: Calendar,
  visitor_arrival: Users,
  system: Info,
};

const typeColors: Record<string, string> = {
  enterprise_signup: "bg-primary/20 text-primary",
  breakage_milestone: "bg-chart-3/20 text-chart-3",
  occupancy_anomaly: "bg-destructive/20 text-destructive",
  credit_inflation: "bg-chart-3/20 text-chart-3",
  monthly_report: "bg-chart-1/20 text-chart-1",
  booking_reminder: "bg-primary/20 text-primary",
  visitor_arrival: "bg-chart-1/20 text-chart-1",
  system: "bg-muted text-muted-foreground",
};

export default function NotificationsPage() {
  const { data: notifications, isLoading } = trpc.notifications.mine.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Stay informed about your workspace activity</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50 animate-pulse">
              <CardContent className="p-6"><div className="h-12" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (notifications ?? []).length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">You're all caught up. Notifications will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(notifications ?? []).map((n) => {
            const Icon = typeIcons[n.type] ?? Info;
            return (
              <Card key={n.id} className={`bg-card border-border/50 ${!n.isRead ? "border-l-2 border-l-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${typeColors[n.type] ?? "bg-muted"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{n.title}</div>
                      {n.message && <div className="text-xs text-muted-foreground mt-1">{n.message}</div>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
