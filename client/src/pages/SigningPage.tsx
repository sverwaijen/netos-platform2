import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { Monitor, Palette, Image, Building2, Upload, Tv, Wifi } from "lucide-react";

export default function SigningPage() {
  const { data: companies } = trpc.companies.list.useQuery();
  const [editCompany, setEditCompany] = useState<any>(null);
  const [brandForm, setBrandForm] = useState({ primaryColor: "#627653", secondaryColor: "#b8a472", welcomeMessage: "" });
  const [tab, setTab] = useState<"branding" | "screens" | "photos">("branding");

  const updateBranding = trpc.companies.updateBranding.useMutation({
    onSuccess: () => { toast.success("Branding updated."); setEditCompany(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEditor = (c: any) => {
    setEditCompany(c);
    setBrandForm({ primaryColor: c.primaryColor || "#627653", secondaryColor: c.secondaryColor || "#b8a472", welcomeMessage: "" });
  };

  const screens = ["Apeldoorn \u2014 Lobby", "Apeldoorn \u2014 Floor 2", "Amsterdam \u2014 Reception", "Amsterdam \u2014 Floor 3", "Rotterdam \u2014 Entrance", "Zwolle \u2014 Lobby", "Ede \u2014 Reception", "Klarenbeek \u2014 Main", "Spijkenisse \u2014 Lobby"];

  return (
    <div className="space-y-8 p-1">
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Digital Signage</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Signing <strong className="font-semibold">platform.</strong>
        </h1>
        <p className="text-sm text-[#888] font-light mt-2 max-w-lg">Dynamic branding on screens at room entry points. Logos, colors and photos update automatically per booking.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Companies", value: (companies ?? []).length, icon: Building2 },
          { label: "With Logo", value: (companies ?? []).filter((c: any) => c.logoUrl).length, icon: Image },
          { label: "With Colors", value: (companies ?? []).filter((c: any) => c.primaryColor).length, icon: Palette },
          { label: "Screens", value: screens.length, icon: Monitor },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] p-5 flex items-center gap-3">
            <kpi.icon className="w-4 h-4 text-[#627653]" />
            <div>
              <div className="text-[10px] text-[#888] tracking-[1px] uppercase">{kpi.label}</div>
              <div className="text-xl font-extralight">{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/[0.06]">
        {([
          { key: "branding", label: "Company Branding" },
          { key: "screens", label: "Screen Status" },
          { key: "photos", label: "Employee Photos" },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-6 py-3 text-[10px] font-semibold tracking-[3px] uppercase transition-all border-b-2 ${tab === t.key ? "border-[#627653] text-white" : "border-transparent text-[#888] hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Branding tab */}
      {tab === "branding" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(companies ?? []).map((c: any) => (
            <Card key={c.id} className="bg-[#111] border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all group">
              <div className="h-2" style={{ background: `linear-gradient(90deg, ${c.primaryColor || "#627653"}, ${c.secondaryColor || "#b8a472"})` }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: `${c.primaryColor || "#627653"}20` }}>
                      {c.logoUrl ? <img src={c.logoUrl} alt="" className="w-6 h-6 object-contain" /> : <Building2 className="w-5 h-5" style={{ color: c.primaryColor || "#627653" }} />}
                    </div>
                    <div>
                      <p className="text-sm font-light">{c.name}</p>
                      <p className="text-[11px] text-[#888]">{c.memberCount} members</p>
                    </div>
                  </div>
                  <button onClick={() => openEditor(c)} className="opacity-0 group-hover:opacity-100 text-[9px] font-semibold tracking-[2px] uppercase text-[#627653] hover:underline transition-all">
                    Edit
                  </button>
                </div>
                {/* Mini preview */}
                <div className="rounded overflow-hidden border border-white/[0.04]">
                  <div className="p-4 text-center" style={{ background: `linear-gradient(135deg, ${c.primaryColor || "#627653"}ee, ${c.primaryColor || "#627653"}88)` }}>
                    <div className="text-white text-sm font-medium">{c.name}</div>
                    <div className="text-white/60 text-[11px]">Welcome to Mr. Green</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border border-white/[0.06]" style={{ backgroundColor: c.primaryColor || "#627653" }} />
                    <span className="text-[10px] text-[#888] font-mono">{c.primaryColor || "#627653"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border border-white/[0.06]" style={{ backgroundColor: c.secondaryColor || "#b8a472" }} />
                    <span className="text-[10px] text-[#888] font-mono">{c.secondaryColor || "#b8a472"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Screens tab */}
      {tab === "screens" && (
        <div className="space-y-0">
          {screens.map((screen, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-white/[0.04] flex items-center justify-center">
                  <Tv className="w-5 h-5 text-[#627653]" />
                </div>
                <div>
                  <p className="text-sm font-light">{screen}</p>
                  <p className="text-[11px] text-[#888]">NETOS Netlink #{1000 + i}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#627653] animate-pulse" />
                <span className="text-[10px] text-[#627653] font-semibold tracking-[2px] uppercase">Online</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photos tab */}
      {tab === "photos" && (
        <div className="text-center py-16">
          <Image className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
          <p className="text-sm text-[#888] font-light mb-1">Employee photo management</p>
          <p className="text-[11px] text-[#888]/60 font-light max-w-sm mx-auto mb-4">Upload employee photos for personalized signing screens. Photos appear when team members open a door.</p>
          <button onClick={() => toast.info("Photo upload coming soon.")} className="px-5 py-3 border border-white/[0.06] text-[10px] font-semibold tracking-[3px] uppercase text-[#888] hover:text-white hover:border-white/20 transition-all">
            <Upload className="w-3.5 h-3.5 inline mr-2" />Upload photos
          </button>
        </div>
      )}

      {/* Branding editor dialog */}
      <Dialog open={!!editCompany} onOpenChange={(open) => { if (!open) setEditCompany(null); }}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Edit branding &mdash; {editCompany?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "primaryColor", label: "Primary" },
                { key: "secondaryColor", label: "Secondary" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">{field.label}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={(brandForm as any)[field.key]} onChange={(e) => setBrandForm({ ...brandForm, [field.key]: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                    <Input value={(brandForm as any)[field.key]} onChange={(e) => setBrandForm({ ...brandForm, [field.key]: e.target.value })} className="bg-white/[0.03] border-white/[0.06] font-mono text-sm" />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Welcome Message</label>
              <Input value={brandForm.welcomeMessage} onChange={(e) => setBrandForm({ ...brandForm, welcomeMessage: e.target.value })} placeholder="Welcome to our office" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            {/* Live preview */}
            <div className="rounded overflow-hidden border border-white/[0.04]">
              <div className="p-8 text-center" style={{ background: `linear-gradient(135deg, ${brandForm.primaryColor}ee, ${brandForm.primaryColor}88)` }}>
                <div className="text-white text-xl font-light">{editCompany?.name}</div>
                <div className="text-white/60 text-sm mt-1">{brandForm.welcomeMessage || "Welcome to Mr. Green"}</div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: brandForm.primaryColor }} />
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: brandForm.secondaryColor }} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompany(null)} className="border-white/10 bg-transparent">Cancel</Button>
            <Button onClick={() => updateBranding.mutate({ companyId: editCompany?.id, primaryColor: brandForm.primaryColor, secondaryColor: brandForm.secondaryColor, welcomeMessage: brandForm.welcomeMessage })} disabled={updateBranding.isPending} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">
              {updateBranding.isPending ? "Saving..." : "Save & push to screens"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
