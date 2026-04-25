import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import { Bell, CheckCheck, AlertTriangle, CreditCard, DoorOpen, Calendar, Users, Info } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  booking_reminder: Calendar, enterprise_signup: Users, breakage_milestone: CreditCard,
  occupancy_anomaly: AlertTriangle, credit_inflation: CreditCard, monthly_report: Calendar,
  visitor_arrival: Users, system: Info,
};

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const { data: notifications, isLoading } = trpc.notifications.mine.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.mine.invalidate() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("All marked as read."); utils.notifications.mine.invalidate(); },
  });
  const [tab, setTab] = useState<"all" | "unread" | "read">("all");

  const unread = (notifications ?? []).filter((n: any) => !n.isRead);
  const readItems = (notifications ?? []).filter((n: any) => n.isRead);
  const items = tab === "unread" ? unread : tab === "read" ? readItems : (notifications ?? []);

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-3">Activity</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Notifi<strong className="font-semibold">cations.</strong>
          </h1>
        </div>
        {unread.length > 0 && (
          <button onClick={() => markAllRead.mutate()} className="flex items-center gap-2 px-5 py-3 border border-white/[0.06] text-[10px] font-semibold tracking-[3px] uppercase text-[#888] hover:text-white hover:border-white/20 transition-all">
            <CheckCheck className="w-3.5 h-3.5" />Mark all read
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-[1px] bg-white/[0.04]">
        <div className="bg-[#111] p-5">
          <div className="text-[10px] text-[#888] tracking-[2px] uppercase mb-1">Total</div>
          <div className="text-2xl font-extralight">{(notifications ?? []).length}</div>
        </div>
        <div className="bg-[#111] p-5">
          <div className="text-[10px] text-[#888] tracking-[2px] uppercase mb-1">Unread</div>
          <div className="text-2xl font-extralight text-[#C4B89E]">{unread.length}</div>
        </div>
        <div className="bg-[#111] p-5">
          <div className="text-[10px] text-[#888] tracking-[2px] uppercase mb-1">Read</div>
          <div className="text-2xl font-extralight">{readItems.length}</div>
        </div>
      </div>

      <div className="flex gap-0 border-b border-white/[0.06]">
        {([
          { key: "all", label: "All", count: (notifications ?? []).length },
          { key: "unread", label: "Unread", count: unread.length },
          { key: "read", label: "Read", count: readItems.length },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-6 py-3 text-[10px] font-semibold tracking-[3px] uppercase transition-all border-b-2 ${tab === t.key ? "border-[#C4B89E] text-white" : "border-transparent text-[#888] hover:text-white"}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
          <p className="text-sm text-[#888] font-light">{tab === "unread" ? "All caught up." : "No notifications."}</p>
        </div>
      ) : (
        <div className="space-y-0">
          {items.map((n: any) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                className={`flex items-start gap-4 py-4 border-b border-white/[0.03] transition-colors ${n.isRead ? "opacity-40" : "hover:bg-white/[0.02] cursor-pointer"}`}
              >
                <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${n.isRead ? "bg-white/[0.03]" : "bg-[#C4B89E]/10"}`}>
                  <Icon className={`w-5 h-5 ${n.isRead ? "text-[#888]" : "text-[#C4B89E]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-light">{n.title}</p>
                    {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-[#C4B89E] shrink-0" />}
                  </div>
                  {n.message && <p className="text-[11px] text-[#888] mt-0.5 line-clamp-2">{n.message}</p>}
                  <p className="text-[10px] text-[#888]/60 mt-1">{new Date(n.createdAt).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
