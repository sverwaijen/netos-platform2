import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ShieldCheck, Calendar, CreditCard, FileText, Clock, Building2 } from "lucide-react";

interface RozBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: any;
  locationId: number;
}

const PERIOD_OPTIONS = [
  { value: "month", label: "1 Maand", months: 1 },
  { value: "6_months", label: "6 Maanden", months: 6 },
  { value: "1_year", label: "1 Jaar", months: 12 },
  { value: "2_year", label: "2 Jaar", months: 24 },
  { value: "3_year", label: "3 Jaar", months: 36 },
  { value: "5_year", label: "5 Jaar", months: 60 },
  { value: "10_year", label: "10 Jaar", months: 120 },
];

export default function RozBookingModal({ open, onOpenChange, resource, locationId }: RozBookingModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("1_year");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [selectedWalletType, setSelectedWalletType] = useState("personal");

  const { data: pricingTiers } = trpc.rozPricingTiers.list.useQuery(
    { resourceId: resource?.id },
    { enabled: !!resource?.id && open }
  );

  const { data: myWallets } = trpc.wallets.mine.useQuery(undefined, { enabled: isAuthenticated });

  const personalWallet = myWallets?.find((w: any) => w.type === "personal");
  const companyWallet = myWallets?.find((w: any) => w.type === "company");
  const activeWallet = selectedWalletType === "company" && companyWallet ? companyWallet : personalWallet;

  const utils = trpc.useUtils();

  const createContract = trpc.rozContracts.create.useMutation({
    onSuccess: (data) => {
      toast.success(`ROZ Contract aangemaakt: ${data.contractNumber}`);
      onOpenChange(false);
      utils.rozContracts.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedTier = useMemo(() => {
    if (!pricingTiers?.length) return null;
    return pricingTiers.find((t: any) => t.periodType === selectedPeriod) || null;
  }, [pricingTiers, selectedPeriod]);

  const pricing = useMemo(() => {
    const period = PERIOD_OPTIONS.find(p => p.value === selectedPeriod);
    if (!period) return null;

    // Use tier pricing if available, otherwise calculate from base rate
    const baseMonthly = selectedTier
      ? parseFloat(selectedTier.creditCostPerMonth)
      : parseFloat(resource?.creditCostPerHour || "0") * 160; // ~160 working hours/month as fallback

    const serviceCharge = selectedTier
      ? parseFloat(selectedTier.serviceChargePerMonth || "0")
      : 0;

    const discount = selectedTier
      ? parseFloat(selectedTier.discountPercent || "0")
      : 0;

    const depositMonths = selectedTier?.depositMonths ?? 3;
    const monthlyAfterDiscount = baseMonthly * (1 - discount / 100);
    const totalMonthly = monthlyAfterDiscount + serviceCharge;
    const totalContract = totalMonthly * period.months;
    const deposit = monthlyAfterDiscount * depositMonths;

    return {
      baseMonthly,
      discount,
      monthlyAfterDiscount,
      serviceCharge,
      totalMonthly,
      totalContract,
      deposit,
      depositMonths,
      months: period.months,
    };
  }, [selectedPeriod, selectedTier, resource]);

  function handleSubmit() {
    if (!resource || !pricing) return;
    const startMs = new Date(startDate).getTime();
    createContract.mutate({
      resourceId: resource.id,
      locationId,
      walletId: activeWallet?.id,
      pricingTierId: selectedTier?.id,
      periodType: selectedPeriod as any,
      startDate: startMs,
      monthlyRentCredits: pricing.monthlyAfterDiscount.toFixed(2),
      monthlyServiceCharge: pricing.serviceCharge.toFixed(2),
      depositAmount: pricing.deposit.toFixed(2),
      indexationMethod: resource.rozIndexation || "CPI",
      indexationPct: resource.rozIndexationPct || "2.50",
      noticePeriodMonths: resource.rozNoticePeriodMonths || 3,
      notes: notes || undefined,
    });
  }

  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle>ROZ Huurovereenkomst</DialogTitle>
              <DialogDescription>{resource.name} · {parseFloat(resource.areaM2 || "0").toFixed(0)}m²</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Period selection */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Huurperiode
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PERIOD_OPTIONS.map((p) => {
                const tier = pricingTiers?.find((t: any) => t.periodType === p.value);
                const isSelected = selectedPeriod === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => setSelectedPeriod(p.value)}
                    className={`p-2.5 rounded-lg text-center transition-all border ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 text-amber-500"
                        : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-amber-500/30"
                    }`}
                  >
                    <p className="text-xs font-medium">{p.label}</p>
                    {tier && parseFloat(tier.discountPercent || "0") > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 text-[9px] mt-1">
                        -{parseFloat(tier.discountPercent || "0").toFixed(0)}%
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start date */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Ingangsdatum
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary/50 border-border/50"
            />
          </div>

          {/* Wallet selection */}
          {myWallets && myWallets.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Betalen met
              </label>
              <div className="flex gap-2">
                {personalWallet && (
                  <button
                    onClick={() => setSelectedWalletType("personal")}
                    className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                      selectedWalletType === "personal" ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">Persoonlijk</p>
                    <p className="text-sm font-bold">{parseFloat(personalWallet.balance).toFixed(0)}c</p>
                  </button>
                )}
                {companyWallet && (
                  <button
                    onClick={() => setSelectedWalletType("company")}
                    className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                      selectedWalletType === "company" ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">Bedrijf</p>
                    <p className="text-sm font-bold">{parseFloat(companyWallet.balance).toFixed(0)}c</p>
                  </button>
                )}
              </div>
            </div>
          )}

          <Textarea
            placeholder="Opmerkingen (optioneel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-secondary/50 border-border/50 text-sm"
            rows={2}
          />

          <Separator />

          {/* Pricing summary */}
          {pricing && (
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">Kostenoverzicht</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Basishuur per maand</span>
                  <span>{pricing.baseMonthly.toFixed(0)} credits</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>Staffelkorting ({pricing.discount.toFixed(0)}%)</span>
                    <span>-{(pricing.baseMonthly * pricing.discount / 100).toFixed(0)} credits</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Huur na korting</span>
                  <span>{pricing.monthlyAfterDiscount.toFixed(0)} credits/mnd</span>
                </div>
                {pricing.serviceCharge > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Servicekosten</span>
                    <span>+{pricing.serviceCharge.toFixed(0)} credits/mnd</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Totaal per maand</span>
                  <span className="text-amber-500">{pricing.totalMonthly.toFixed(0)} credits</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Totaal contract ({pricing.months} mnd)</span>
                  <span>{pricing.totalContract.toFixed(0)} credits</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Waarborgsom ({pricing.depositMonths} mnd huur)</span>
                  <span>{pricing.deposit.toFixed(0)} credits</span>
                </div>
              </div>
            </div>
          )}

          {/* ROZ notice */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
            <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Bij bevestiging ontvang je automatisch de <strong className="text-foreground">ROZ-huurovereenkomst</strong> per e-mail.
              Het contract wordt actief na ondertekening en betaling van de waarborgsom.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button
            disabled={!isAuthenticated || createContract.isPending}
            onClick={handleSubmit}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            {createContract.isPending ? "Verwerken..." : "ROZ Contract aanvragen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
