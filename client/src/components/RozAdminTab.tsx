import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ShieldCheck, Plus, Pencil, Building2, FileText, CreditCard,
  Clock, Calculator, CheckCircle2, AlertTriangle, Trash2, Receipt,
} from "lucide-react";
import RozInvoicesTab from "@/components/RozInvoicesTab";

const PERIOD_LABELS: Record<string, string> = {
  month: "1 Maand", "6_months": "6 Maanden", "1_year": "1 Jaar",
  "2_year": "2 Jaar", "3_year": "3 Jaar", "5_year": "5 Jaar", "10_year": "10 Jaar",
};

const CONTRACT_TYPES = [
  { value: "kantoorruimte", label: "Kantoorruimte" },
  { value: "winkelruimte", label: "Winkelruimte" },
  { value: "bedrijfsruimte", label: "Bedrijfsruimte" },
];

const SERVICE_MODELS = [
  { value: "voorschot", label: "Voorschot (maandelijks vooraf)" },
  { value: "nacalculatie", label: "Nacalculatie (achteraf werkelijk)" },
];

const INDEXATION_METHODS = [
  { value: "CPI", label: "CPI (Consumentenprijsindex)" },
  { value: "fixed_pct", label: "Vast percentage" },
  { value: "none", label: "Geen indexatie" },
];

// ─── ROZ Resource Settings ───
function RozResourceSettings() {
  const { data: resources } = trpc.resources.search.useQuery({});
  const utils = trpc.useUtils();
  const updateSettings = trpc.rozResourceSettings.update.useMutation({
    onSuccess: () => {
      utils.resources.search.invalidate();
      toast.success("ROZ instellingen opgeslagen");
    },
    onError: (e) => toast.error(e.message),
  });

  const [editResource, setEditResource] = useState<any>(null);
  const [form, setForm] = useState({
    areaM2: "",
    rozContractType: "kantoorruimte",
    rozServiceChargeModel: "voorschot",
    rozVatRate: "21.00",
    rozIndexation: "CPI",
    rozIndexationPct: "2.50",
    rozTenantProtection: true,
    rozMinLeaseTerm: 1,
    rozNoticePeriodMonths: 3,
  });

  function openEdit(r: any) {
    setEditResource(r);
    setForm({
      areaM2: r.areaM2 || "",
      rozContractType: r.rozContractType || "kantoorruimte",
      rozServiceChargeModel: r.rozServiceChargeModel || "voorschot",
      rozVatRate: r.rozVatRate || "21.00",
      rozIndexation: r.rozIndexation || "CPI",
      rozIndexationPct: r.rozIndexationPct || "2.50",
      rozTenantProtection: r.rozTenantProtection ?? true,
      rozMinLeaseTerm: r.rozMinLeaseTerm ?? 1,
      rozNoticePeriodMonths: r.rozNoticePeriodMonths ?? 3,
    });
  }

  function handleSave() {
    if (!editResource) return;
    updateSettings.mutate({
      resourceId: editResource.id,
      ...form,
      rozMinLeaseTerm: Number(form.rozMinLeaseTerm),
      rozNoticePeriodMonths: Number(form.rozNoticePeriodMonths),
    });
    setEditResource(null);
  }

  const rozResources = resources?.filter((r: any) => r.isRozEligible) || [];
  const nonRozResources = resources?.filter((r: any) => !r.isRozEligible) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            ROZ Resource Instellingen
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Stel oppervlakte en ROZ-voorwaarden in per resource. Ruimtes ≥100m² krijgen automatisch het ROZ-label.
          </p>
        </div>
      </div>

      {/* ROZ Eligible Resources */}
      {rozResources.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            ROZ-gelabelde ruimtes ({rozResources.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rozResources.map((r: any) => (
              <Card key={r.id} className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{r.name}</h4>
                        <Badge className="bg-amber-500/20 text-amber-500 text-[9px]">ROZ</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.type?.replace("_", " ")} · {parseFloat(r.areaM2 || "0").toFixed(0)}m² · {r.rozContractType || "kantoorruimte"}
                      </p>
                      <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>BTW: {r.rozVatRate || "21"}%</span>
                        <span>Indexatie: {r.rozIndexation || "CPI"}</span>
                        <span>Opzegtermijn: {r.rozNoticePeriodMonths || 3} mnd</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Non-ROZ Resources */}
      {nonRozResources.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            Overige ruimtes — stel oppervlakte in om ROZ te activeren ({nonRozResources.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {nonRozResources.map((r: any) => (
              <Card key={r.id} className="bg-white/[0.02] border-border/30">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.type?.replace("_", " ")} · {r.areaM2 ? `${parseFloat(r.areaM2).toFixed(0)}m²` : "Geen m² ingesteld"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                    <Pencil className="w-3 h-3 mr-1" /> Instellen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editResource} onOpenChange={(open) => { if (!open) setEditResource(null); }}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              ROZ Instellingen: {editResource?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Oppervlakte (m²)</Label>
                <Input
                  type="number"
                  value={form.areaM2}
                  onChange={(e) => setForm(f => ({ ...f, areaM2: e.target.value }))}
                  placeholder="bijv. 150"
                  className="bg-secondary/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {parseFloat(form.areaM2 || "0") >= 100
                    ? "✓ ROZ-label wordt automatisch toegekend"
                    : "Minimaal 100m² voor ROZ-label"}
                </p>
              </div>
              <div>
                <Label className="text-xs">Contract type</Label>
                <Select value={form.rozContractType} onValueChange={(v) => setForm(f => ({ ...f, rozContractType: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map(ct => (
                      <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Servicekosten model</Label>
                <Select value={form.rozServiceChargeModel} onValueChange={(v) => setForm(f => ({ ...f, rozServiceChargeModel: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_MODELS.map(sm => (
                      <SelectItem key={sm.value} value={sm.value}>{sm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">BTW tarief (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.rozVatRate}
                  onChange={(e) => setForm(f => ({ ...f, rozVatRate: e.target.value }))}
                  className="bg-secondary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Indexatie methode</Label>
                <Select value={form.rozIndexation} onValueChange={(v) => setForm(f => ({ ...f, rozIndexation: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INDEXATION_METHODS.map(im => (
                      <SelectItem key={im.value} value={im.value}>{im.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.rozIndexation === "fixed_pct" && (
                <div>
                  <Label className="text-xs">Indexatie percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.rozIndexationPct}
                    onChange={(e) => setForm(f => ({ ...f, rozIndexationPct: e.target.value }))}
                    className="bg-secondary/50"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Min. huurtermijn (maanden)</Label>
                <Input
                  type="number"
                  value={form.rozMinLeaseTerm}
                  onChange={(e) => setForm(f => ({ ...f, rozMinLeaseTerm: parseInt(e.target.value) || 1 }))}
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <Label className="text-xs">Opzegtermijn (maanden)</Label>
                <Input
                  type="number"
                  value={form.rozNoticePeriodMonths}
                  onChange={(e) => setForm(f => ({ ...f, rozNoticePeriodMonths: parseInt(e.target.value) || 3 }))}
                  className="bg-secondary/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
              <div>
                <Label className="text-xs font-medium">Huurbescherming</Label>
                <p className="text-[10px] text-muted-foreground">Huurder heeft recht op huurbescherming conform ROZ-model</p>
              </div>
              <Switch
                checked={form.rozTenantProtection}
                onCheckedChange={(v) => setForm(f => ({ ...f, rozTenantProtection: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditResource(null)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={updateSettings.isPending} className="bg-amber-500 text-white hover:bg-amber-600">
              {updateSettings.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ROZ Pricing Tiers ───
function RozPricingTiersSection() {
  const { data: tiers, isLoading } = trpc.rozPricingTiers.list.useQuery({});
  const { data: resources } = trpc.resources.search.useQuery({});
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    resourceId: undefined as number | undefined,
    periodType: "1_year" as string,
    creditCostPerMonth: "",
    creditCostPerM2PerMonth: "",
    discountPercent: "0",
    serviceChargePerMonth: "0",
    depositMonths: 3,
  });

  const createMut = trpc.rozPricingTiers.create.useMutation({
    onSuccess: () => {
      utils.rozPricingTiers.list.invalidate();
      setShowCreate(false);
      toast.success("Staffelprijs aangemaakt");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.rozPricingTiers.delete.useMutation({
    onSuccess: () => {
      utils.rozPricingTiers.list.invalidate();
      toast.success("Staffelprijs verwijderd");
    },
  });

  const rozResources = resources?.filter((r: any) => r.isRozEligible) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-500" />
            Staffelprijzen
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Stel credit-prijzen in per huurperiode. Langere contracten = lagere maandprijs.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-amber-500 text-white hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-1.5" /> Staffelprijs
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}</div>
      ) : !tiers?.length ? (
        <Card className="bg-white/[0.02] border-border/30">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nog geen staffelprijzen ingesteld</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tiers.map((tier: any) => {
            const resource = resources?.find((r: any) => r.id === tier.resourceId);
            return (
              <Card key={tier.id} className="bg-white/[0.02] border-border/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{tier.name}</p>
                        <Badge className="text-[9px] bg-amber-500/20 text-amber-500">
                          {PERIOD_LABELS[tier.periodType] || tier.periodType}
                        </Badge>
                        {parseFloat(tier.discountPercent || "0") > 0 && (
                          <Badge className="text-[9px] bg-green-500/20 text-green-400">
                            -{parseFloat(tier.discountPercent).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {parseFloat(tier.creditCostPerMonth).toFixed(0)} credits/mnd
                        {resource ? ` · ${resource.name}` : " · Alle ruimtes"}
                        {parseFloat(tier.serviceChargePerMonth || "0") > 0 && ` · +${parseFloat(tier.serviceChargePerMonth).toFixed(0)}c servicekosten`}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate({ id: tier.id })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" /> Nieuwe Staffelprijs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Naam</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="bijv. Kantoor 1 Jaar" className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Resource (optioneel)</Label>
                <Select value={form.resourceId?.toString() || "all"} onValueChange={(v) => setForm(f => ({ ...f, resourceId: v === "all" ? undefined : parseInt(v) }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Alle ruimtes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle ROZ-ruimtes</SelectItem>
                    {rozResources.map((r: any) => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Periode</Label>
                <Select value={form.periodType} onValueChange={(v) => setForm(f => ({ ...f, periodType: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Credits per maand</Label>
                <Input type="number" value={form.creditCostPerMonth} onChange={(e) => setForm(f => ({ ...f, creditCostPerMonth: e.target.value }))} className="bg-secondary/50" />
              </div>
              <div>
                <Label className="text-xs">Korting (%)</Label>
                <Input type="number" value={form.discountPercent} onChange={(e) => setForm(f => ({ ...f, discountPercent: e.target.value }))} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Servicekosten/mnd</Label>
                <Input type="number" value={form.serviceChargePerMonth} onChange={(e) => setForm(f => ({ ...f, serviceChargePerMonth: e.target.value }))} className="bg-secondary/50" />
              </div>
              <div>
                <Label className="text-xs">Waarborgsom (maanden)</Label>
                <Input type="number" value={form.depositMonths} onChange={(e) => setForm(f => ({ ...f, depositMonths: parseInt(e.target.value) || 3 }))} className="bg-secondary/50" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuleren</Button>
            <Button
              disabled={!form.name || !form.creditCostPerMonth || createMut.isPending}
              onClick={() => createMut.mutate({
                name: form.name,
                resourceId: form.resourceId,
                periodType: form.periodType as any,
                creditCostPerMonth: form.creditCostPerMonth,
                discountPercent: form.discountPercent,
                serviceChargePerMonth: form.serviceChargePerMonth,
                depositMonths: form.depositMonths,
              })}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {createMut.isPending ? "Aanmaken..." : "Aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ROZ Contracts Overview ───
function RozContractsSection() {
  const { data: contracts, isLoading } = trpc.rozContracts.list.useQuery({});
  const { data: stats } = trpc.rozContracts.stats.useQuery();
  const { data: resources } = trpc.resources.search.useQuery({});
  const utils = trpc.useUtils();

  const activateMut = trpc.rozContracts.activate.useMutation({
    onSuccess: () => {
      utils.rozContracts.list.invalidate();
      utils.rozContracts.stats.invalidate();
      toast.success("Contract geactiveerd");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.rozContracts.update.useMutation({
    onSuccess: () => {
      utils.rozContracts.list.invalidate();
      toast.success("Contract bijgewerkt");
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-400",
    pending_signature: "bg-blue-500/20 text-blue-400",
    active: "bg-green-500/20 text-green-400",
    notice_given: "bg-amber-500/20 text-amber-400",
    expired: "bg-red-500/20 text-red-400",
    terminated: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" />
          ROZ Contracten
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Overzicht van alle ROZ-huurovereenkomsten.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalContracts}</p>
              <p className="text-[10px] text-muted-foreground">Totaal contracten</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.activeContracts}</p>
              <p className="text-[10px] text-muted-foreground">Actief</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.totalMonthlyRevenue.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Credits/maand</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.rozEligibleResources}</p>
              <p className="text-[10px] text-muted-foreground">ROZ-ruimtes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>
      ) : !contracts?.length ? (
        <Card className="bg-white/[0.02] border-border/30">
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nog geen ROZ-contracten</p>
            <p className="text-[11px] mt-1">Contracten worden aangemaakt wanneer huurders een ROZ-ruimte boeken.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contracts.map((c: any) => {
            const resource = resources?.find((r: any) => r.id === c.resourceId);
            return (
              <Card key={c.id} className="bg-white/[0.02] border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium font-mono">{c.contractNumber}</p>
                        <Badge className={`text-[9px] ${STATUS_COLORS[c.status] || ""}`}>
                          {c.status.replace("_", " ")}
                        </Badge>
                        <Badge className="text-[9px] bg-amber-500/20 text-amber-500">
                          {PERIOD_LABELS[c.periodType] || c.periodType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {resource?.name || `Resource #${c.resourceId}`} ·
                        {parseFloat(c.monthlyRentCredits).toFixed(0)} credits/mnd
                        {parseFloat(c.monthlyServiceCharge || "0") > 0 && ` + ${parseFloat(c.monthlyServiceCharge).toFixed(0)} servicekosten`}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(c.startDate).toLocaleDateString("nl-NL")} — {new Date(c.endDate).toLocaleDateString("nl-NL")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {c.status === "draft" && (
                        <Button size="sm" variant="outline" className="text-amber-500 border-amber-500/30" onClick={() => activateMut.mutate({ contractId: c.id })}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Activeren
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ROZ Admin Tab ───
export default function RozAdminTab() {
  const [section, setSection] = useState<"settings" | "pricing" | "contracts" | "invoices">("settings");

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-2 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setSection("settings")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            section === "settings" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" /> Instellingen
        </button>
        <button
          onClick={() => setSection("pricing")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            section === "pricing" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calculator className="w-4 h-4" /> Staffelprijzen
        </button>
        <button
          onClick={() => setSection("contracts")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            section === "contracts" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" /> Contracten
        </button>
        <button
          onClick={() => setSection("invoices")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            section === "invoices" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt className="w-4 h-4" /> Facturatie
        </button>
      </div>

      {section === "settings" && <RozResourceSettings />}
      {section === "pricing" && <RozPricingTiersSection />}
      {section === "contracts" && <RozContractsSection />}
      {section === "invoices" && <RozInvoicesTab />}
    </div>
  );
}
