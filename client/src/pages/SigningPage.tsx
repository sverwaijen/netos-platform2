import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useState } from "react";
import {
  Monitor, Upload, Palette, Image, Building2, Eye, Wifi, Zap,
  CheckCircle2, Settings, Users, Tv, ArrowRight
} from "lucide-react";

export default function SigningPage() {
  const { data: companies } = trpc.companies.list.useQuery();
  const [editCompany, setEditCompany] = useState<any>(null);
  const [brandForm, setBrandForm] = useState({ primaryColor: "#00C853", secondaryColor: "#1a1a2e", welcomeMessage: "" });

  const updateBranding = trpc.companies.updateBranding.useMutation({
    onSuccess: () => { toast.success("Branding updated! Signing screens will refresh."); setEditCompany(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEditor = (c: any) => {
    setEditCompany(c);
    setBrandForm({ primaryColor: c.primaryColor || "#00C853", secondaryColor: c.secondaryColor || "#1a1a2e", welcomeMessage: "" });
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Signing Platform</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage digital signage and company branding across all locations.</p>
        </div>
        <Badge variant="secondary" className="text-xs"><Wifi className="w-3 h-3 mr-1" />Live Connected</Badge>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { icon: Upload, title: "Upload", desc: "Logo, colors & photos" },
          { icon: Settings, title: "Configure", desc: "Welcome message & layout" },
          { icon: Zap, title: "Auto-Trigger", desc: "Activates on booking/entry" },
          { icon: Tv, title: "Display", desc: "Screens show company brand" },
        ].map((s, i) => (
          <Card key={i} className="glass-card border-border/50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2"><s.icon className="w-5 h-5 text-primary" /></div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Company Branding */}
      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Company Branding</TabsTrigger>
          <TabsTrigger value="screens">Screen Status</TabsTrigger>
          <TabsTrigger value="photos">Employee Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(companies ?? []).map((c: any) => (
              <Card key={c.id} className="glass-card border-border/50 overflow-hidden">
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${c.primaryColor || "#00C853"}, ${c.secondaryColor || "#1a1a2e"})` }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: c.primaryColor ?? "#1a1a2e" }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{c.name}</h3>
                        <p className="text-xs text-muted-foreground">{c.memberCount} members</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEditor(c)}><Palette className="w-3 h-3 mr-1" />Edit</Button>
                  </div>
                  {/* Live Preview */}
                  <div className="rounded-xl overflow-hidden border border-border/30">
                    <div className="p-6 text-center relative" style={{ background: `linear-gradient(135deg, ${c.primaryColor || "#00C853"}ee, ${c.primaryColor || "#00C853"}88)` }}>
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/20 rounded-full px-2 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-netos-green animate-pulse" />
                        <span className="text-[9px] text-white/70">LIVE</span>
                      </div>
                      <div className="text-white text-xl font-bold mb-1">{c.name}</div>
                      <div className="text-white/70 text-sm">Welcome to Mr. Green</div>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-white/30" style={{ backgroundColor: c.primaryColor || "#00C853" }} />
                        <div className="w-4 h-4 rounded-full border-2 border-white/30" style={{ backgroundColor: c.secondaryColor || "#1a1a2e" }} />
                      </div>
                    </div>
                    <div className="bg-secondary/50 p-2 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Monitor className="w-3 h-3" />Signing Screen Preview</span>
                      <span className="text-[10px] text-muted-foreground">16:9</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="screens" className="mt-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {["Apeldoorn - Lobby", "Apeldoorn - Floor 2", "Amsterdam - Reception", "Amsterdam - Floor 3", "Rotterdam - Entrance", "Zwolle - Lobby", "Ede - Reception", "Klarenbeek - Main", "Spijkenisse - Lobby"].map((screen, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
                    <div className="flex items-center gap-3">
                      <Tv className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{screen}</p>
                        <p className="text-[10px] text-muted-foreground">NETOS Netlink #{1000 + i}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-netos-green animate-pulse" />
                      <span className="text-[10px] text-netos-green">Online</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-8 text-center">
              <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Employee Photos</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Upload employee photos for personalized signing screens. When a team member opens a door, their photo and company branding appear on the display.
              </p>
              <Button variant="outline" onClick={() => toast.info("Photo upload requires S3 integration")}><Upload className="w-4 h-4 mr-2" />Upload Photos</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Branding Editor Dialog */}
      <Dialog open={!!editCompany} onOpenChange={(open) => { if (!open) setEditCompany(null); }}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-primary" />Edit Branding - {editCompany?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Primary Color</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={brandForm.primaryColor} onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                  <Input value={brandForm.primaryColor} onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })} className="bg-secondary/50 border-border/50 font-mono text-sm" />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Secondary Color</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={brandForm.secondaryColor} onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                  <Input value={brandForm.secondaryColor} onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })} className="bg-secondary/50 border-border/50 font-mono text-sm" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Welcome Message</p>
              <Input value={brandForm.welcomeMessage} onChange={(e) => setBrandForm({ ...brandForm, welcomeMessage: e.target.value })} placeholder="Welcome to our office" className="bg-secondary/50 border-border/50" />
            </div>
            {/* Live Preview */}
            <div className="rounded-xl overflow-hidden border border-border/30">
              <div className="p-8 text-center" style={{ background: `linear-gradient(135deg, ${brandForm.primaryColor}ee, ${brandForm.primaryColor}88)` }}>
                <div className="text-white text-xl font-bold mb-1">{editCompany?.name}</div>
                <div className="text-white/70 text-sm">{brandForm.welcomeMessage || "Welcome to Mr. Green"}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompany(null)}>Cancel</Button>
            <Button onClick={() => updateBranding.mutate({ companyId: editCompany?.id, primaryColor: brandForm.primaryColor, secondaryColor: brandForm.secondaryColor, welcomeMessage: brandForm.welcomeMessage })} disabled={updateBranding.isPending}>
              {updateBranding.isPending ? "Saving..." : "Save & Push to Screens"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
