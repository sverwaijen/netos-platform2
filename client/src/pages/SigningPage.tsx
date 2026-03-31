import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Upload, Palette, Image, Building2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function SigningPage() {
  const { data: companies } = trpc.companies.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Signing Platform</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage digital signage and company branding across all locations
        </p>
      </div>

      {/* How it works */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">How Signing Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground mb-1">Upload Branding</div>
              <div className="text-xs text-muted-foreground">Logo, colors, photos, welcome message</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <Monitor className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground mb-1">Auto-Display</div>
              <div className="text-xs text-muted-foreground">Screens update when you book or enter</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <Eye className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground mb-1">Live Preview</div>
              <div className="text-xs text-muted-foreground">See exactly what visitors see at your door</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Branding Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Company Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(companies ?? []).map((c) => (
            <Card key={c.id} className="bg-card border-border/50 overflow-hidden">
              <div className="h-2" style={{ background: `linear-gradient(90deg, ${c.primaryColor}, ${c.secondaryColor})` }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: c.primaryColor ?? "#1a1a2e" }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.memberCount} members</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-transparent" onClick={() => toast.info("Branding editor coming soon")}>
                    <Palette className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
                {/* Preview */}
                <div
                  className="rounded-lg p-6 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${c.primaryColor}ee, ${c.primaryColor}99)`,
                  }}
                >
                  <div className="text-white text-lg font-bold mb-1">{c.name}</div>
                  <div className="text-white/70 text-sm">Welcome to Mr. Green</div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.secondaryColor ?? "#e94560" }} />
                    <span className="text-white/50 text-xs">Signing screen preview</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Employee Photos */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Employee Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Image className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Upload employee photos for personalized signing screens.
              When a team member opens a door, their photo and company branding appear.
            </p>
            <Button variant="outline" className="bg-transparent" onClick={() => toast.info("Photo upload coming soon")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
