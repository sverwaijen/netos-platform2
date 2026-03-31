import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import {
  UserPlus, Link2, QrCode, Shield, Copy, Send, Clock, Check,
  Mail, Phone, Building2, Smartphone, Users
} from "lucide-react";

export default function InvitesPage() {
  const { data: invites, isLoading } = trpc.invites.mine.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();
  const utils = trpc.useUtils();

  const createInvite = trpc.invites.create.useMutation({
    onSuccess: (data) => {
      toast.success("Invite created!");
      setLastLink(data.inviteLink);
      utils.invites.mine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "guest">("guest");
  const [companyId, setCompanyId] = useState<string>("");
  const [lastLink, setLastLink] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    if (!email && !phone) { toast.error("Provide email or phone"); return; }
    createInvite.mutate({
      email: email || undefined,
      phone: phone || undefined,
      role,
      companyId: companyId && companyId !== "none" ? parseInt(companyId) : undefined,
    });
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  const pending = invites?.filter((i: any) => i.status === "pending") ?? [];
  const accepted = invites?.filter((i: any) => i.status === "accepted") ?? [];

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invites</h1>
          <p className="text-muted-foreground text-sm mt-1">Invite members and guests to NET OS.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" />Create Invite</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border/50">
            <DialogHeader><DialogTitle>Create New Invite</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5" />Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="bg-secondary/30 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2"><Phone className="w-3.5 h-3.5" />Phone (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 6 12345678" className="bg-secondary/30 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Access Level</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "user" | "guest")}>
                  <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Guest (Lite Access)</SelectItem>
                    <SelectItem value="user">Full Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {companies && companies.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />Company</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue placeholder="No company" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No company</SelectItem>
                      {companies.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleCreate} disabled={createInvite.isPending} className="w-full">
                <Send className="w-4 h-4 mr-2" />{createInvite.isPending ? "Creating..." : "Send Invite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card border-border/50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{invites?.length ?? 0}</p><p className="text-xs text-muted-foreground mt-1">Total</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-400">{pending.length}</p><p className="text-xs text-muted-foreground mt-1">Pending</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{accepted.length}</p><p className="text-xs text-muted-foreground mt-1">Accepted</p></CardContent></Card>
      </div>

      {lastLink && (
        <Card className="glass-card border-primary/30 glow-green">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Link2 className="w-5 h-5 text-primary" /></div>
              <div><p className="text-sm font-medium">Invite Link</p><p className="text-xs text-muted-foreground font-mono truncate max-w-md">{lastLink}</p></div>
            </div>
            <Button variant="outline" size="sm" onClick={() => copyLink(lastLink)} className="bg-transparent"><Copy className="w-3.5 h-3.5 mr-1" />Copy</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Link2, title: "Deep Link", desc: "Share via email, SMS, or WhatsApp.", color: "text-primary" },
          { icon: QrCode, title: "QR Code", desc: "Scan at reception for instant access.", color: "text-amber-400" },
          { icon: Smartphone, title: "App Download", desc: "Auto-access based on invite level.", color: "text-blue-400" },
        ].map((item) => (
          <Card key={item.title} className="glass-card border-border/50">
            <CardContent className="p-5"><item.icon className={`w-6 h-6 ${item.color} mb-3`} /><h3 className="font-semibold text-sm mb-1">{item.title}</h3><p className="text-xs text-muted-foreground">{item.desc}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Access Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { tier: "Guest", desc: "One-time visit. Zone 0.", zone: "Zone 0", color: "text-muted-foreground" },
              { tier: "Lite Member", desc: "Basic + coffee. Zone 0-1.", zone: "Zone 0-1", color: "text-blue-400" },
              { tier: "Full Member", desc: "All zones, wallet, bookings.", zone: "Zone 0-3", color: "text-primary" },
              { tier: "Admin", desc: "Full access + management.", zone: "All", color: "text-amber-400" },
            ].map((t) => (
              <div key={t.tier} className="rounded-xl p-4 border border-border/30 bg-secondary/10">
                <div className={`text-xs font-mono ${t.color} mb-2`}>{t.zone}</div>
                <h4 className="font-semibold text-sm mb-1">{t.tier}</h4>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Invite History</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : invites && invites.length > 0 ? (
            <div className="space-y-2">
              {invites.map((invite: any) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${invite.status === "accepted" ? "bg-primary/20" : "bg-amber-500/20"}`}>
                      {invite.status === "accepted" ? <Check className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{invite.email || invite.phone || "—"}</p>
                      <p className="text-xs text-muted-foreground">{invite.role} · {new Date(invite.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invite.status === "accepted" ? "default" : "secondary"} className="text-xs">{invite.status}</Badge>
                    {invite.status === "pending" && (
                      <Button variant="ghost" size="sm" onClick={() => copyLink(`https://netos.mrgreenoffices.nl/invite/${invite.token}`)}><Copy className="w-3.5 h-3.5" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No invites yet. Create your first invite above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
