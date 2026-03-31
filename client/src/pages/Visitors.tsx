import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import {
  UserPlus, Users, Car, Mail, Phone, Calendar, MapPin,
  CheckCircle2, XCircle, Clock, Send, QrCode, LogIn, LogOut
} from "lucide-react";

const STATUS: Record<string, { color: string; icon: any; label: string }> = {
  invited: { color: "bg-amber-500/20 text-amber-400", icon: Send, label: "Invited" },
  checked_in: { color: "bg-netos-green/20 text-netos-green", icon: LogIn, label: "Checked In" },
  checked_out: { color: "bg-blue-500/20 text-blue-400", icon: LogOut, label: "Checked Out" },
  cancelled: { color: "bg-red-500/20 text-red-400", icon: XCircle, label: "Cancelled" },
};

export default function Visitors() {
  const { isAuthenticated } = useAuth();
  const { data: visitors, isLoading } = trpc.visitors.mine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: locations } = trpc.locations.list.useQuery();
  const utils = trpc.useUtils();
  const createVisitor = trpc.visitors.create.useMutation({
    onSuccess: () => { toast.success("Visitor invited! Deep link sent."); setOpen(false); setForm({ name: "", email: "", phone: "", licensePlate: "", locationId: "" }); utils.visitors.mine.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateStatus = trpc.visitors.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); utils.visitors.mine.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", licensePlate: "", locationId: "" });

  const handleSubmit = () => {
    if (!form.name || !form.locationId) { toast.error("Name and location required"); return; }
    createVisitor.mutate({
      name: form.name, email: form.email || undefined, phone: form.phone || undefined,
      licensePlate: form.licensePlate || undefined, visitDate: Date.now() + 86400000, locationId: parseInt(form.locationId),
    });
  };

  const today = (visitors ?? []).filter((v: any) => {
    const d = new Date(Number(v.visitDate));
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const upcoming = (visitors ?? []).filter((v: any) => new Date(Number(v.visitDate)) > new Date() && v.status === "invited");
  const checkedIn = (visitors ?? []).filter((v: any) => v.status === "checked_in");

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  const renderVisitor = (v: any) => {
    const status = STATUS[v.status] || STATUS.invited;
    const StatusIcon = status.icon;
    return (
      <div key={v.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors border border-border/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-medium text-sm">{v.name}</h3>
              <Badge className={`text-[10px] ${status.color}`}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {v.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{v.email}</span>}
              {v.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</span>}
              {v.licensePlate && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{v.licensePlate}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(Number(v.visitDate)).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {v.status === "invited" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: v.id, status: "checked_in" as const })}>
              <LogIn className="w-3 h-3 mr-1" />Check In
            </Button>
          )}
          {v.status === "checked_in" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: v.id, status: "checked_out" as const })}>
              <LogOut className="w-3 h-3 mr-1" />Check Out
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visitors</h1>
          <p className="text-muted-foreground text-sm mt-1">Invite guests and manage visitor access.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><UserPlus className="w-4 h-4 mr-2" />Invite Visitor</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />Invite a Visitor</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-xs text-muted-foreground">Name *</Label><Input placeholder="Visitor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary/50 border-border/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Email</Label><Input placeholder="visitor@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary/50 border-border/50" /></div>
                <div><Label className="text-xs text-muted-foreground">Phone</Label><Input placeholder="+31 6 1234 5678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-secondary/50 border-border/50" /></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">License Plate</Label><Input placeholder="AB-123-CD" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className="bg-secondary/50 border-border/50" /></div>
              <div>
                <Label className="text-xs text-muted-foreground">Location *</Label>
                <Select value={form.locationId} onValueChange={(v) => setForm({ ...form, locationId: v })}>
                  <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>{(locations ?? []).map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1 mb-1"><Send className="w-3 h-3" />A deep link will be sent via SMS/WhatsApp</p>
                <p className="flex items-center gap-1"><QrCode className="w-3 h-3" />Visitor can scan QR at reception for instant access</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createVisitor.isPending || !form.name || !form.locationId}>
                {createVisitor.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Visitors</p><p className="text-2xl font-bold">{(visitors ?? []).length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Today</p><p className="text-2xl font-bold text-netos-green">{today.length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Checked In</p><p className="text-2xl font-bold text-purple-400">{checkedIn.length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Upcoming</p><p className="text-2xl font-bold text-amber-400">{upcoming.length}</p></CardContent></Card>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({(visitors ?? []).length})</TabsTrigger>
              <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
              <TabsTrigger value="checked_in">Active ({checkedIn.length})</TabsTrigger>
            </TabsList>
            {[{ key: "all", items: visitors ?? [] }, { key: "today", items: today }, { key: "checked_in", items: checkedIn }].map(({ key, items }) => (
              <TabsContent key={key} value={key}>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {items.map(renderVisitor)}
                    {items.length === 0 && (
                      <div className="text-center py-16">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No visitors</h3>
                        <p className="text-sm text-muted-foreground">Invite your first guest to any Mr. Green location.</p>
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
