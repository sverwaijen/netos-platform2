import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Bell, AlertTriangle, TrendingUp, Users, CreditCard, Calendar, Info,
  CheckCircle2, Eye, BellOff
} from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  enterprise_signup: Users, breakage_milestone: TrendingUp,
  occupancy_anomaly: AlertTriangle, credit_inflation: CreditCard,
  monthly_report: Calendar, booking_reminder: Calendar,
  visitor_arrival: Users, system: Info,
};
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  enterprise_signup: { bg: "bg-netos-green/10", text: "text-netos-green" },
  breakage_milestone: { bg: "bg-amber-500/10", text: "text-amber-400" },
  occupancy_anomaly: { bg: "bg-red-500/10", text: "text-red-400" },
  credit_inflation: { bg: "bg-purple-500/10", text: "text-purple-400" },
  monthly_report: { bg: "bg-blue-500/10", text: "text-blue-400" },
  booking_reminder: { bg: "bg-netos-green/10", text: "text-netos-green" },
  visitor_arrival: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  system: { bg: "bg-secondary", text: "text-muted-foreground" },
};

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const { data: notifications, isLoading } = trpc.notifications.mine.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.mine.invalidate(),
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      utils.notifications.mine.invalidate();
    },
  });

  const unread = (notifications ?? []).filter((n: any) => !n.isRead);
  const read = (notifications ?? []).filter((n: any) => n.isRead);

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  const renderNotification = (n: any) => {
    const Icon = TYPE_ICONS[n.type] ?? Info;
    const colors = TYPE_COLORS[n.type] ?? TYPE_COLORS.system;
    return (
      <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl transition-colors border border-border/20 ${!n.isRead ? "bg-primary/5 border-l-2 border-l-primary" : "bg-secondary/20 hover:bg-secondary/40"}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-medium">{n.title}</h3>
            {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
          </div>
          {n.message && <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>}
          <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        {!n.isRead && (
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary" onClick={() => markRead.mutate({ id: n.id })}>
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay informed about your workspace activity.</p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCircle2 className="w-3 h-3 mr-1" />Mark All Read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{(notifications ?? []).length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Unread</p><p className="text-2xl font-bold text-primary">{unread.length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Read</p><p className="text-2xl font-bold text-muted-foreground">{read.length}</p></CardContent></Card>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({(notifications ?? []).length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
              <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
            </TabsList>
            {[{ key: "all", items: notifications ?? [] }, { key: "unread", items: unread }, { key: "read", items: read }].map(({ key, items }) => (
              <TabsContent key={key} value={key}>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {items.map(renderNotification)}
                    {items.length === 0 && (
                      <div className="text-center py-16">
                        <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">{key === "unread" ? "All caught up!" : "No notifications"}</h3>
                        <p className="text-sm text-muted-foreground">{key === "unread" ? "You have no unread notifications." : "Notifications will appear here."}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
