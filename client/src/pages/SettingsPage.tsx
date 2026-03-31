import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  User, Shield, Bell, Key, Plug, Save, LogOut, Phone, Mail,
  Car, Building2, Lock, Wifi, CreditCard, Calendar, Zap, Check, Smartphone
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: myWallets } = trpc.wallets.mine.useQuery();
  const { data: accessLog } = trpc.access.myLog.useQuery();

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      utils.profile.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licensePlate, setLicensePlate] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setLicensePlate("");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({ name, phone });
  };

  const personalWallet = myWallets?.find((w: any) => w.type === "personal");

  return (
    <div className="space-y-6 p-1 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, access, and integrations.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="profile" className="gap-2"><User className="w-3.5 h-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-3.5 h-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="access" className="gap-2"><Key className="w-3.5 h-3.5" />Access</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><Plug className="w-3.5 h-3.5" />Integrations</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your profile details visible to other members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {(name || user?.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{name || user?.name || "Member"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{user?.role === "admin" ? "Admin" : "Member"}</Badge>
                    {personalWallet && (
                      <Badge variant="secondary" className="text-xs">{parseFloat(personalWallet.balance).toFixed(0)} credits</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2"><User className="w-3.5 h-3.5" />Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="bg-secondary/30 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="w-3.5 h-3.5" />Email</Label>
                  <Input value={user?.email ?? ""} disabled className="bg-secondary/20 border-border/30 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="w-3.5 h-3.5" />Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 6 12345678" className="bg-secondary/30 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2"><Car className="w-3.5 h-3.5" />License Plate</Label>
                  <Input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="AB-123-CD" className="bg-secondary/30 border-border/50" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" className="bg-transparent text-destructive hover:bg-destructive/10 border-destructive/30" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />Sign Out
                </Button>
                <Button onClick={handleSave} disabled={updateProfile.isPending}>
                  <Save className="w-4 h-4 mr-2" />{updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Booking Confirmations", desc: "Get notified when a booking is confirmed or cancelled", icon: Calendar, defaultOn: true },
                { label: "Credit Alerts", desc: "Low balance warnings and top-up reminders", icon: CreditCard, defaultOn: true },
                { label: "Visitor Arrivals", desc: "Notifications when your invited visitors check in", icon: Building2, defaultOn: true },
                { label: "Occupancy Updates", desc: "Real-time occupancy alerts for your preferred locations", icon: Wifi, defaultOn: false },
                { label: "System Updates", desc: "Platform updates, maintenance windows, and new features", icon: Zap, defaultOn: false },
                { label: "Marketing", desc: "Special offers, events, and community updates", icon: Bell, defaultOn: false },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <pref.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                    </div>
                  </div>
                  <Switch defaultChecked={pref.defaultOn} onCheckedChange={() => toast.success(`${pref.label} preference updated`)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Tab */}
        <TabsContent value="access" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Zone Access</CardTitle>
              <CardDescription>Your current access levels across all locations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { zone: "Zone 0", name: "Transit", desc: "Lobby & corridors", color: "text-muted-foreground", active: true },
                  { zone: "Zone 1", name: "Base Access", desc: "Lounge & WiFi", color: "text-blue-400", active: true },
                  { zone: "Zone 2", name: "Smart Desk", desc: "Flex desks", color: "text-primary", active: true },
                  { zone: "Zone 3", name: "Private", desc: "Meeting rooms", color: "text-amber-400", active: false },
                ].map((z) => (
                  <div key={z.zone} className={`rounded-xl p-4 border ${z.active ? "border-primary/30 bg-primary/5" : "border-border/30 bg-secondary/20"}`}>
                    <div className={`text-xs font-mono ${z.color} mb-1 flex items-center gap-1`}>
                      <Lock className="w-3 h-3" />{z.zone}
                    </div>
                    <p className="text-sm font-medium">{z.name}</p>
                    <p className="text-xs text-muted-foreground">{z.desc}</p>
                    <Badge variant={z.active ? "default" : "secondary"} className="mt-2 text-xs">
                      {z.active ? "Active" : "Locked"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Salto KS Mobile Key</CardTitle>
              <CardDescription>Your digital key for door access across all locations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Mobile Key</p>
                    <p className="text-xs text-muted-foreground">BLE + NFC enabled</p>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Check className="w-3 h-3 mr-1" />Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {accessLog && accessLog.length > 0 && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Recent Access Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accessLog.slice(0, 10).map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${entry.action === "entry" ? "bg-primary" : entry.action === "denied" ? "bg-destructive" : "bg-muted-foreground"}`} />
                        <div>
                          <p className="text-sm">{entry.action === "entry" ? "Entered" : entry.action === "exit" ? "Exited" : entry.action}</p>
                          <p className="text-xs text-muted-foreground">{entry.zone ?? "—"} · {entry.method ?? "auto"}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Connected Services</CardTitle>
              <CardDescription>Manage your integrations with external services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Salto KS", desc: "Smart access control for all locations", icon: Key, status: "connected", color: "text-primary" },
                { name: "Stripe", desc: "Payment processing for credit purchases", icon: CreditCard, status: "connected", color: "text-primary" },
                { name: "NETOS IoT", desc: "Device and sensor management platform", icon: Wifi, status: "connected", color: "text-primary" },
                { name: "Calendar Sync", desc: "Sync bookings with Google/Outlook calendar", icon: Calendar, status: "pending", color: "text-amber-400" },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 rounded-xl border border-border/30 hover:border-border/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <integration.icon className={`w-5 h-5 ${integration.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">{integration.desc}</p>
                    </div>
                  </div>
                  <Badge variant={integration.status === "connected" ? "default" : "secondary"} className={integration.status === "connected" ? "bg-primary/20 text-primary border-primary/30" : ""}>
                    {integration.status === "connected" ? "Connected" : "Setup Required"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
