import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import { UserPlus, Link2, QrCode, Shield, Copy, Send, Clock, Check, Smartphone, Users } from "lucide-react";

export default function InvitesPage() {
  const { data: invites, isLoading } = trpc.invites.mine.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();
  const utils = trpc.useUtils();
  const createInvite = trpc.invites.create.useMutation({
    onSuccess: (data) => { toast.success("Invite created!"); setLastLink(data.inviteLink); setDialogOpen(false); utils.invites.mine.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "guest">("guest");
  const [companyId, setCompanyId] = useState<string>("");
  const [lastLink, setLastLink] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const pending = invites?.filter((i: any) => i.status === "pending") ?? [];
  const accepted = invites?.filter((i: any) => i.status === "accepted") ?? [];

  const copyLink = (link: string) => { navigator.clipboard.writeText(link); toast.success("Link copied."); };

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Exclusive Access</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Invite <strong className="font-semibold">only.</strong>
          </h1>
        </div>
        <button onClick={() => setDialogOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-[#627653] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all">
          <UserPlus className="w-3.5 h-3.5" />Create invite
        </button>
      </div>

      <div className="grid grid-cols-3 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Total", value: invites?.length ?? 0 },
          { label: "Pending", value: pending.length },
          { label: "Accepted", value: accepted.length, accent: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] p-5">
            <div className="text-[10px] text-[#888] tracking-[2px] uppercase mb-1">{kpi.label}</div>
            <div className={`text-2xl font-extralight ${kpi.accent ? "text-[#627653]" : ""}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {lastLink && (
        <div className="flex items-center justify-between p-5 bg-[#627653]/5 border border-[#627653]/20">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-[#627653]" />
            <div>
              <p className="text-sm font-light">Invite link created</p>
              <p className="text-[11px] text-[#888] font-mono truncate max-w-md">{lastLink}</p>
            </div>
          </div>
          <button onClick={() => copyLink(lastLink)} className="px-4 py-2 text-[9px] font-semibold tracking-[2px] uppercase border border-[#627653]/30 text-[#627653] hover:bg-[#627653]/10 transition-all">
            <Copy className="w-3 h-3 inline mr-1" />Copy
          </button>
        </div>
      )}

      {/* Access tiers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { tier: "Guest", zone: "Zone 0", desc: "One-time visit access" },
          { tier: "Lite Member", zone: "Zone 0-1", desc: "Basic + coffee" },
          { tier: "Full Member", zone: "Zone 0-3", desc: "All zones, wallet, bookings" },
          { tier: "Admin", zone: "All", desc: "Full access + management" },
        ].map((t, i) => (
          <div key={i} className="bg-[#111] p-5 border border-white/[0.06]">
            <div className="text-[10px] font-mono text-[#627653] mb-2">{t.zone}</div>
            <p className="text-sm font-light mb-1">{t.tier}</p>
            <p className="text-[11px] text-[#888]">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Invite methods */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Link2, title: "Deep Link", desc: "Email, SMS, or WhatsApp" },
          { icon: QrCode, title: "QR Code", desc: "Scan at reception" },
          { icon: Smartphone, title: "App Download", desc: "Auto-access on install" },
        ].map((m, i) => (
          <div key={i} className="bg-[#111] p-5 border border-white/[0.06] flex items-start gap-3">
            <m.icon className="w-4 h-4 text-[#627653] mt-0.5" />
            <div>
              <p className="text-sm font-light">{m.title}</p>
              <p className="text-[11px] text-[#888]">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invite history */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">History</div>
        <h3 className="text-lg font-extralight mb-4">Sent <strong className="font-semibold">invites.</strong></h3>
        {(invites ?? []).length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
            <p className="text-sm text-[#888] font-light">No invites yet.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {(invites ?? []).map((inv: any) => {
              const isAccepted = inv.status === "accepted";
              return (
                <div key={inv.id} className="flex items-center justify-between py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${isAccepted ? "bg-[#627653]/10" : "bg-white/[0.04]"}`}>
                      {isAccepted ? <Check className="w-5 h-5 text-[#627653]" /> : <Clock className="w-5 h-5 text-[#888]" />}
                    </div>
                    <div>
                      <p className="text-sm font-light">{inv.email || inv.phone || "\u2014"}</p>
                      <p className="text-[11px] text-[#888]">{inv.role} &middot; {new Date(inv.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-semibold tracking-[2px] uppercase ${isAccepted ? "text-[#627653]" : "text-[#888]"}`}>{inv.status}</span>
                    {inv.status === "pending" && (
                      <button onClick={() => copyLink(`https://netos.mrgreenoffices.nl/invite/${inv.token}`)} className="text-[#888] hover:text-white transition-all">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create invite dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-md">
          <DialogHeader><DialogTitle className="font-light text-lg">Create invite</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Phone (optional)</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 6 12345678" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Access Level</label>
              <Select value={role} onValueChange={(v) => setRole(v as "user" | "guest")}>
                <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest (Lite Access)</SelectItem>
                  <SelectItem value="user">Full Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {companies && companies.length > 0 && (
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Company</label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="No company" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No company</SelectItem>
                    {companies.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 bg-transparent">Cancel</Button>
            <Button disabled={createInvite.isPending || (!email && !phone)} onClick={() => {
              createInvite.mutate({ email: email || undefined, phone: phone || undefined, role, companyId: companyId && companyId !== "none" ? parseInt(companyId) : undefined });
            }} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">
              <Send className="w-3.5 h-3.5 mr-2" />{createInvite.isPending ? "Creating..." : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
