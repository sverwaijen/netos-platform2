import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { User, Bell, Key, Plug, Save, LogOut, Phone, Mail, Car, Lock, Wifi, CreditCard, Calendar, Smartphone, Check } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: myWallets } = trpc.wallets.mine.useQuery();
  const { data: accessLog } = trpc.access.myLog.useQuery();
  const { roleLabel } = usePermissions();

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success("Profile updated."); utils.profile.get.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState("");
  const [phone, setPhoneVal] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [tab, setTab] = useState<"profile" | "notifications" | "access" | "integrations">("profile");

  useEffect(() => {
    if (profile) { setName(profile.name ?? ""); setPhoneVal(profile.phone ?? ""); }
  }, [profile]);

  const personalWallet = myWallets?.find((w: any) => w.type === "personal");

  return (
    <div className="space-y-8 p-1 max-w-4xl">
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Account</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Set<strong className="font-semibold">tings.</strong>
        </h1>
      </div>

      <div className="flex gap-0 border-b border-white/[0.06]">
        {([
          { key: "profile", label: "Profile", icon: User },
          { key: "notifications", label: "Notifications", icon: Bell },
          { key: "access", label: "Access", icon: Key },
          { key: "integrations", label: "Integrations", icon: Plug },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-6 py-3 text-[10px] font-semibold tracking-[3px] uppercase transition-all border-b-2 ${tab === t.key ? "border-[#627653] text-white" : "border-transparent text-[#888] hover:text-white"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === "profile" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded bg-[#627653]/10 flex items-center justify-center text-xl font-light text-[#627653]">
              {(name || user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-light">{name || user?.name || "Member"}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#888] mt-0.5">
                <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#627653]">{roleLabel}</span>
                {personalWallet && <span>{parseFloat(personalWallet.balance).toFixed(0)} credits</span>}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/[0.04]" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Full Name", icon: User, value: name, onChange: setName, placeholder: "Your name" },
              { key: "email", label: "Email", icon: Mail, value: user?.email ?? "", onChange: () => {}, placeholder: "", disabled: true },
              { key: "phone", label: "Phone", icon: Phone, value: phone, onChange: setPhoneVal, placeholder: "+31 6 12345678" },
              { key: "plate", label: "License Plate", icon: Car, value: licensePlate, onChange: setLicensePlate, placeholder: "AB-123-CD" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium flex items-center gap-1"><f.icon className="w-3 h-3" />{f.label}</label>
                <Input value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder} disabled={f.disabled} className={`mt-1 ${f.disabled ? "bg-white/[0.01] border-white/[0.03] text-[#888]" : "bg-white/[0.03] border-white/[0.06]"}`} />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={logout} className="flex items-center gap-2 px-5 py-3 border border-red-500/20 text-[10px] font-semibold tracking-[3px] uppercase text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-3.5 h-3.5" />Sign out
            </button>
            <button onClick={() => updateProfile.mutate({ name, phone })} disabled={updateProfile.isPending} className="flex items-center gap-2 px-5 py-3 bg-[#627653] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all">
              <Save className="w-3.5 h-3.5" />{updateProfile.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="space-y-0">
          {[
            { label: "Booking Confirmations", desc: "When a booking is confirmed or cancelled", icon: Calendar, on: true },
            { label: "Credit Alerts", desc: "Low balance warnings and top-up reminders", icon: CreditCard, on: true },
            { label: "Visitor Arrivals", desc: "When your invited visitors check in", icon: User, on: true },
            { label: "Occupancy Updates", desc: "Real-time occupancy alerts", icon: Wifi, on: false },
            { label: "System Updates", desc: "Platform updates and new features", icon: Key, on: false },
            { label: "Marketing", desc: "Special offers and events", icon: Bell, on: false },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between py-4 border-b border-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-white/[0.04] flex items-center justify-center">
                  <pref.icon className="w-5 h-5 text-[#888]" />
                </div>
                <div>
                  <p className="text-sm font-light">{pref.label}</p>
                  <p className="text-[11px] text-[#888]">{pref.desc}</p>
                </div>
              </div>
              <Switch defaultChecked={pref.on} onCheckedChange={() => toast.success(`${pref.label} updated.`)} />
            </div>
          ))}
        </div>
      )}

      {/* Access */}
      {tab === "access" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { zone: "Zone 0", name: "Transit", desc: "Lobby & corridors", active: true },
              { zone: "Zone 1", name: "Base Access", desc: "Lounge & WiFi", active: true },
              { zone: "Zone 2", name: "Smart Desk", desc: "Flex desks", active: true },
              { zone: "Zone 3", name: "Private", desc: "Meeting rooms", active: false },
            ].map((z) => (
              <div key={z.zone} className={`p-5 border ${z.active ? "border-[#627653]/20 bg-[#627653]/5" : "border-white/[0.06] bg-[#111]"}`}>
                <div className="text-[10px] font-mono text-[#627653] mb-2 flex items-center gap-1"><Lock className="w-3 h-3" />{z.zone}</div>
                <p className="text-sm font-light">{z.name}</p>
                <p className="text-[11px] text-[#888]">{z.desc}</p>
                <div className={`mt-2 text-[9px] font-semibold tracking-[2px] uppercase ${z.active ? "text-[#627653]" : "text-[#888]"}`}>{z.active ? "Active" : "Locked"}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-5 bg-[#627653]/5 border border-[#627653]/20">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#627653]" />
              <div>
                <p className="text-sm font-light">Salto KS Mobile Key</p>
                <p className="text-[11px] text-[#888]">BLE + NFC enabled</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#627653] flex items-center gap-1"><Check className="w-3 h-3" />Active</span>
          </div>

          {accessLog && accessLog.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Log</div>
              <h3 className="text-lg font-extralight mb-4">Recent <strong className="font-semibold">access.</strong></h3>
              <div className="space-y-0">
                {accessLog.slice(0, 10).map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between py-3 border-b border-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${entry.action === "entry" ? "bg-[#627653]" : entry.action === "denied" ? "bg-red-400" : "bg-[#888]"}`} />
                      <div>
                        <p className="text-sm font-light">{entry.action === "entry" ? "Entered" : entry.action === "exit" ? "Exited" : entry.action}</p>
                        <p className="text-[11px] text-[#888]">{entry.zone ?? "\u2014"} &middot; {entry.method ?? "auto"}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#888]">{new Date(entry.createdAt).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Integrations */}
      {tab === "integrations" && (
        <div className="space-y-0">
          {[
            { name: "Salto KS", desc: "Smart access control", icon: Key, connected: true },
            { name: "Stripe", desc: "Payment processing", icon: CreditCard, connected: true },
            { name: "NETOS IoT", desc: "Device & sensor management", icon: Wifi, connected: true },
            { name: "Calendar Sync", desc: "Google/Outlook sync", icon: Calendar, connected: false },
          ].map((int) => (
            <div key={int.name} className="flex items-center justify-between py-4 border-b border-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded flex items-center justify-center ${int.connected ? "bg-[#627653]/10" : "bg-white/[0.04]"}`}>
                  <int.icon className={`w-5 h-5 ${int.connected ? "text-[#627653]" : "text-[#888]"}`} />
                </div>
                <div>
                  <p className="text-sm font-light">{int.name}</p>
                  <p className="text-[11px] text-[#888]">{int.desc}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold tracking-[2px] uppercase ${int.connected ? "text-[#627653]" : "text-[#888]"}`}>
                {int.connected ? "Connected" : "Setup required"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
