import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, Car, Mail, Phone, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  invited: "bg-chart-3/20 text-chart-3",
  checked_in: "bg-primary/20 text-primary",
  checked_out: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function Visitors() {
  const { data: visitors, isLoading } = trpc.visitors.mine.useQuery();
  const { data: locations } = trpc.locations.list.useQuery();
  const createVisitor = trpc.visitors.create.useMutation({
    onSuccess: () => { toast.success("Visitor invited! Deep link sent."); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", licensePlate: "", locationId: "" });

  const handleSubmit = () => {
    if (!form.name || !form.locationId) { toast.error("Name and location required"); return; }
    createVisitor.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      licensePlate: form.licensePlate || undefined,
      visitDate: Date.now() + 86400000,
      locationId: parseInt(form.locationId),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visitors</h1>
          <p className="text-muted-foreground text-sm mt-1">Invite guests and manage visitor access</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Invite Visitor</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Invite a Visitor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Name *</Label>
                <Input placeholder="Visitor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary/50 border-border" />
              </div>
              <div>
                <Label>Email</Label>
                <Input placeholder="visitor@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary/50 border-border" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="+31 6 12345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-secondary/50 border-border" />
              </div>
              <div>
                <Label>License Plate</Label>
                <Input placeholder="AB-123-CD" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className="bg-secondary/50 border-border" />
              </div>
              <div>
                <Label>Location *</Label>
                <Select value={form.locationId} onValueChange={(v) => setForm({ ...form, locationId: v })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {(locations ?? []).map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={createVisitor.isPending}>
                {createVisitor.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50 animate-pulse">
              <CardContent className="p-6"><div className="h-16" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (visitors ?? []).length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No visitors yet</h3>
            <p className="text-sm text-muted-foreground">Invite your first guest to any Mr. Green location</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(visitors ?? []).map((v) => (
            <Card key={v.id} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{v.name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {v.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{v.email}</span>}
                        {v.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{v.phone}</span>}
                        {v.licensePlate && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{v.licensePlate}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(Number(v.visitDate)).toLocaleDateString()}
                    </span>
                    <Badge className={statusColors[v.status] ?? ""} variant="secondary">{v.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
