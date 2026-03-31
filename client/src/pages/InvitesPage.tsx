import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus, Link, QrCode, Smartphone, Copy } from "lucide-react";
import { toast } from "sonner";

export default function InvitesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invites</h1>
        <p className="text-muted-foreground text-sm mt-1">NET OS is invite-only. Manage your invitations here.</p>
      </div>

      {/* Invite System */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Invite-Only Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            NET OS is an exclusive workspace community. Members can invite colleagues, partners, and guests
            via personalized deep links. Invitees get a lite version of the app to experience Mr. Green.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <Link className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground mb-1">Deep Link</div>
              <div className="text-xs text-muted-foreground">SMS/WhatsApp invite with app download</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <QrCode className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground mb-1">QR Code</div>
              <div className="text-xs text-muted-foreground">Scan at reception for instant access</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <Smartphone className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground mb-1">Lite Access</div>
              <div className="text-xs text-muted-foreground">Basic app access for invited guests</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Invite */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Generate Invite Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground font-mono truncate">
              https://netos.mrgreen.nl/invite/...
            </div>
            <Button variant="outline" className="bg-transparent shrink-0" onClick={() => toast.info("Invite link generation coming soon")}>
              <Copy className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Each invite link is unique and expires after 7 days. Invitees must verify via phone number.
          </p>
        </CardContent>
      </Card>

      {/* Invite Tiers */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Access Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { tier: "Guest", desc: "Visitor access for one day. Free coffee, WiFi, lobby access.", color: "text-muted-foreground" },
              { tier: "Lite Member", desc: "Basic Access bundle. Can book desks and use Zone 0-1.", color: "text-chart-1" },
              { tier: "Full Member", desc: "Full platform access with company wallet and all zones.", color: "text-primary" },
              { tier: "Admin", desc: "Company admin with team management and billing access.", color: "text-chart-3" },
            ].map((t) => (
              <div key={t.tier} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <div className={`text-sm font-medium ${t.color}`}>{t.tier}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toast.info("Feature coming soon")}>
                  <UserPlus className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
