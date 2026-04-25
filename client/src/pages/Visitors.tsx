import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import { UserPlus, Users, Car, Clock, Send, CheckCircle, LogIn, LogOut, QrCode } from "lucide-react";

export default function Visitors() {
  const { isAuthenticated } = useAuth();
  const { data: visitors, isLoading } = trpc.visitors.mine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: locations } = trpc.locations.list.useQuery();
  const utils = trpc.useUtils();
  const createVisitor = trpc.visitors.create.useMutation({
    onSuccess: () => { toast.success("Visitor invited!"); setOpen(false); setForm({ name: "", email: "", phone: "", licensePlate: "", locationId: "" }); utils.visitors.mine.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateStatus = trpc.visitors.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated."); utils.visitors.mine.invalidate(); },
  });
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "today" | "active">("all");
  const [form, setForm] = useState({ name: "", email: "", phone: "", licensePlate: "", locationId: "" });

  const today = (visitors ?? []).filter((v: any) => {
    const d = new Date(Number(v.visitDate));
    return d.toDateString() === new Date().toDateString();
  });
  const checkedIn = (visitors ?? []).filter((v: any) => v.status === "checked_in");
  const items = tab === "today" ? today : tab === "active" ? checkedIn : (visitors ?? []);

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-3">Hospitality</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Visitor <strong className="font-semibold">management.</strong>
          </h1>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-[#C4B89E] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all">
          <UserPlus className="w-3.5 h-3.5" />Invite visitor
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Total", value: (visitors ?? []).length },
          { label: "Today", value: today.length, accent: true },
          { label: "Checked In", value: checkedIn.length },
          { label: "With Plate", value: (visitors ?? []).filter((v: any) => v.licensePlate).length },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] p-5">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{kpi.label}</div>
            <div className={`text-2xl font-extralight ${kpi.accent ? "text-[#C4B89E]" : ""}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-0 border-b border-white/[0.06]">
        {([
          { key: "all", label: "All", count: (visitors ?? []).length },
          { key: "today", label: "Today", count: today.length },
          { key: "active", label: "Active", count: checkedIn.length },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-6 py-3 text-[10px] font-semibold tracking-[3px] uppercase transition-all border-b-2 ${tab === t.key ? "border-[#C4B89E] text-white" : "border-transparent text-[#888] hover:text-white"}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
          <p className="text-sm text-[#888] font-light">No visitors found.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {items.map((v: any) => {
            const isIn = v.status === "checked_in";
            const isPending = v.status === "invited" || !v.status;
            return (
              <div key={v.id} className="flex items-center justify-between py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-white/[0.04] flex items-center justify-center text-sm font-light text-[#888]">
                    {(v.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-light">{v.name || "Guest"}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#888] mt-0.5">
                      {v.email && <span>{v.email}</span>}
                      {v.licensePlate && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{v.licensePlate}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(Number(v.visitDate)).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {isIn ? <CheckCircle className="w-3.5 h-3.5 text-[#C4B89E]" /> : <Clock className="w-3.5 h-3.5 text-[#888]" />}
                    <span className={`text-[10px] font-semibold tracking-[2px] uppercase ${isIn ? "text-[#C4B89E]" : "text-[#888]"}`}>{v.status || "invited"}</span>
                  </div>
                  {isPending && (
                    <button onClick={() => updateStatus.mutate({ id: v.id, status: "checked_in" as const })} className="px-3 py-1.5 text-[9px] font-semibold tracking-[2px] uppercase border border-[#C4B89E]/30 text-[#C4B89E] hover:bg-[#C4B89E]/10 transition-all">
                      <LogIn className="w-3 h-3 inline mr-1" />Check in
                    </button>
                  )}
                  {isIn && (
                    <button onClick={() => updateStatus.mutate({ id: v.id, status: "checked_out" as const })} className="px-3 py-1.5 text-[9px] font-semibold tracking-[2px] uppercase border border-white/[0.06] text-[#888] hover:bg-white/[0.04] transition-all">
                      <LogOut className="w-3 h-3 inline mr-1" />Check out
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-md">
          <DialogHeader><DialogTitle className="font-light text-lg">Invite visitor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[
              { key: "name", label: "Name *", placeholder: "Full name" },
              { key: "email", label: "Email", placeholder: "visitor@email.com" },
              { key: "phone", label: "Phone", placeholder: "+31 6 1234 5678" },
              { key: "licensePlate", label: "License Plate", placeholder: "AB-123-CD" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">{f.label}</label>
                <Input value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            ))}
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Location *</label>
              <Select value={form.locationId} onValueChange={(v) => setForm({ ...form, locationId: v })}>
                <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{(locations ?? []).map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="bg-white/[0.03] p-3 text-[11px] text-[#888]">
              <p className="flex items-center gap-1 mb-1"><Send className="w-3 h-3" />Deep link sent via SMS/WhatsApp</p>
              <p className="flex items-center gap-1"><QrCode className="w-3 h-3" />QR scan at reception for instant access</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-white/10 bg-transparent">Cancel</Button>
            <Button disabled={createVisitor.isPending || !form.name || !form.locationId} onClick={() => {
              createVisitor.mutate({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, licensePlate: form.licensePlate || undefined, visitDate: Date.now() + 86400000, locationId: parseInt(form.locationId) });
            }} className="bg-[#C4B89E] text-white hover:bg-[#4a5a3f]">
              <Send className="w-3.5 h-3.5 mr-2" />{createVisitor.isPending ? "Sending..." : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
