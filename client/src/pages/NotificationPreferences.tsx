import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, Zap } from "lucide-react";

interface NotificationPrefs {
  booking: boolean;
  wallet: boolean;
  parking: boolean;
  operations: boolean;
  community: boolean;
  system: boolean;
}

interface RecentNotif {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({ booking: true, wallet: true, parking: true, operations: true, community: true, system: true });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailDigest, setEmailDigest] = useState<"daily" | "weekly" | "off">("daily");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [bypassQuiet, setBypassQuiet] = useState(true);

  const recentNotifs: RecentNotif[] = [
    { id: "1", title: "Booking Confirmed", message: "Your room booking confirmed", timestamp: "2 hours ago", read: false },
    { id: "2", title: "Credits Low", message: "Wallet balance below 50 credits", timestamp: "5 hours ago", read: false },
    { id: "3", title: "Parking Reminder", message: "Active parking session", timestamp: "1 day ago", read: true },
    { id: "4", title: "Community Event", message: "Monthly Team Gathering on April 20th", timestamp: "2 days ago", read: true },
  ];

  const handlePrefChange = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRequestPushPermission = async () => {
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setPushEnabled(true);
          toast.success("Push notifications enabled");
        } else {
          toast.error("Push notification permission denied");
        }
      }
    } catch (error) {
      toast.error("Failed to request push permissions");
    }
  };

  const unreadCount = recentNotifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-8 p-1">
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">System</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">Notification <strong className="font-semibold">Preferences.</strong></h1>
      </div>

      <Card className="bg-[#111] border-white/[0.06]">
        <CardHeader><CardTitle className="text-sm text-[#627653]">Notification Categories</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "booking" as const, label: "Booking Updates" },
            { key: "wallet" as const, label: "Wallet & Credits" },
            { key: "parking" as const, label: "Parking Alerts" },
            { key: "operations" as const, label: "Operations" },
            { key: "community" as const, label: "Community Events" },
            { key: "system" as const, label: "System Messages" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded bg-white/[0.02] border border-white/[0.06]">
              <span className="text-sm">{label}</span>
              <Switch checked={prefs[key]} onCheckedChange={() => handlePrefChange(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-[#111] border-white/[0.06]">
        <CardHeader><CardTitle className="text-sm text-[#627653] flex items-center gap-2"><Zap className="w-4 h-4" /> Push Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded bg-white/[0.02] border border-white/[0.06]">
            <div><p className="text-sm font-semibold mb-1">Browser Notifications</p><p className="text-xs text-[#888]">Receive real-time alerts</p></div>
            {!pushEnabled ? (
              <Button onClick={handleRequestPushPermission} className="bg-[#627653] text-white text-xs font-semibold">Enable</Button>
            ) : (
              <div className="text-xs text-[#627653] font-semibold">Enabled</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#111] border-white/[0.06]">
        <CardHeader><CardTitle className="text-sm text-[#627653]">Email Digest</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#888] mb-3 uppercase">Frequency</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ value: "daily" as const, label: "Daily" }, { value: "weekly" as const, label: "Weekly" }, { value: "off" as const, label: "Off" }].map(({ value, label }) => (
                <button key={value} onClick={() => setEmailDigest(value)} className={`px-3 py-2 text-xs font-semibold rounded ${emailDigest === value ? "bg-[#627653] text-white" : "bg-white/[0.04] text-[#888]"}`}>{label}</button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#111] border-white/[0.06]">
        <CardHeader><CardTitle className="text-sm text-[#627653] flex items-center gap-2"><Clock className="w-4 h-4" /> Quiet Hours</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[#888]">Pause non-urgent notifications during these hours</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#888] mb-2 block uppercase">Start Time</label>
              <input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#888] mb-2 block uppercase">End Time</label>
              <input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded bg-white/[0.02] border border-white/[0.06] mt-4">
            <div><p className="text-xs font-semibold mb-1">Bypass for Urgent</p><p className="text-xs text-[#888]">Critical alerts still come through</p></div>
            <Switch checked={bypassQuiet} onCheckedChange={setBypassQuiet} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Preferences saved")} className="bg-[#627653] text-white text-xs font-semibold">Save Preferences</Button>
      </div>

      <Card className="bg-[#111] border-white/[0.06]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-[#627653] flex items-center gap-2">
            <Bell className="w-4 h-4" /> Recent Notifications
            {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 text-xs bg-[#627653]/20 text-[#627653] rounded-full">{unreadCount}</span>}
          </CardTitle>
          {unreadCount > 0 && (
            <button onClick={() => toast.success("All marked as read")} className="text-xs text-[#627653] font-semibold uppercase">Mark All Read</button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentNotifs.length === 0 ? (
              <div className="text-center py-8 text-[#666]"><Bell className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-xs">No notifications yet</p></div>
            ) : (
              recentNotifs.map((notif) => (
                <div key={notif.id} className={`p-3 rounded border ${notif.read ? "bg-white/[0.02] border-white/[0.06]" : "bg-[#627653]/10 border-[#627653]/20"}`}>
                  <div className="flex gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? "bg-[#666]" : "bg-[#627653]"}`} />
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${notif.read ? "text-[#ccc]" : "text-white"}`}>{notif.title}</p>
                      <p className="text-xs text-[#888] mt-1">{notif.message}</p>
                      <p className="text-[10px] text-[#666] mt-2">{notif.timestamp}</p>
                    </div>
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
