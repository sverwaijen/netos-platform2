import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, FileText, Calculator, Clock, Home, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface RozInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: {
    name?: string;
    areaM2?: string | null;
    rozContractType?: string | null;
    rozServiceChargeModel?: string | null;
    rozVatRate?: string | null;
    rozIndexation?: string | null;
    rozIndexationPct?: string | null;
    rozTenantProtection?: boolean | null;
    rozMinLeaseTerm?: number | null;
    rozNoticePeriodMonths?: number | null;
  };
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  kantoorruimte: "Kantoorruimte",
  winkelruimte: "Winkelruimte",
  bedrijfsruimte: "Bedrijfsruimte",
};

const SERVICE_CHARGE_LABELS: Record<string, string> = {
  voorschot: "Voorschot (maandelijks vooraf)",
  nacalculatie: "Nacalculatie (achteraf op werkelijke kosten)",
};

const INDEXATION_LABELS: Record<string, string> = {
  CPI: "CPI (Consumentenprijsindex)",
  fixed_pct: "Vast percentage",
  none: "Geen indexatie",
};

export default function RozInfoModal({ open, onOpenChange, resource }: RozInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-xl">ROZ Huurovereenkomst</DialogTitle>
              <DialogDescription className="text-sm">
                {resource?.name ? `Voor: ${resource.name}` : "Wat is een ROZ-overeenkomst en wat betekent het voor jou?"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            {/* Jip en Janneke uitleg */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-amber-500">In het kort (Jip en Janneke)</h3>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Een <strong className="text-foreground">ROZ-overeenkomst</strong> is het standaard huurcontract dat in heel Nederland wordt gebruikt voor bedrijfsruimtes.
                  ROZ staat voor <strong className="text-foreground">Raad voor Onroerende Zaken</strong> en zij maken de modelcontracten
                  die verhuurders en huurders beschermen.
                </p>
                <p>
                  <strong className="text-foreground">Wat betekent dit voor jou?</strong> Als je een ruimte huurt van 100m&sup2; of groter,
                  dan krijg je automatisch een ROZ-contract. Dit is geen keuze maar een standaard in de vastgoedwereld.
                  Het contract regelt duidelijk wie waarvoor betaalt en welke rechten je hebt.
                </p>
              </div>
            </div>

            {/* Verschil met flexibele boeking */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Verschil: ROZ-huur vs. Flexibele boeking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <Badge className="bg-primary/20 text-primary mb-2">Flexibele boeking</Badge>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#x2022;</span>Per uur, dag of week boeken</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#x2022;</span>Geen vast contract</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#x2022;</span>Credits worden direct afgeschreven</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#x2022;</span>Vrij opzegbaar</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">&#x2022;</span>Servicekosten inbegrepen</li>
                  </ul>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                  <Badge className="bg-amber-500/20 text-amber-500 mb-2">ROZ Huurovereenkomst</Badge>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#x2022;</span>Vaste huurperiode (1 mnd - 10 jaar)</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#x2022;</span>Officieel ROZ-contract</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#x2022;</span>Maandelijkse facturatie in credits</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#x2022;</span>Opzegtermijn van toepassing</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#x2022;</span>Servicekosten apart afgerekend</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Servicekosten uitleg */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Servicekosten
              </h3>
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  Bij een ROZ-huurovereenkomst worden de <strong className="text-foreground">servicekosten apart berekend</strong>.
                  Dit zijn kosten voor onderhoud, schoonmaak, beveiliging, energie en andere faciliteiten.
                </p>
                <p>
                  Er zijn twee modellen:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                    <p className="font-medium text-foreground text-xs mb-1">Voorschot</p>
                    <p className="text-[11px]">Je betaalt maandelijks een geschat bedrag vooraf. Aan het einde van het jaar wordt afgerekend op basis van werkelijke kosten.</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                    <p className="font-medium text-foreground text-xs mb-1">Nacalculatie</p>
                    <p className="text-[11px]">Je betaalt achteraf op basis van de werkelijke kosten. Geen verrassingen, maar de maandelijkse kosten kunnen variëren.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Huurbescherming */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                Huurbescherming
              </h3>
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  Bij een ROZ-huurovereenkomst heb je als huurder <strong className="text-foreground">huurbescherming</strong>.
                  Dit betekent:
                </p>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    <span>De verhuurder kan het contract niet zomaar opzeggen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    <span>Je hebt recht op een opzegtermijn (standaard 3 maanden)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    <span>Huurprijsaanpassing alleen via indexatie (bijv. CPI)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    <span>Bij geschillen kun je naar de huurcommissie of rechter</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Staffelprijzen uitleg */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Staffelprijzen per looptijd
              </h3>
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  Hoe langer je huurt, hoe <strong className="text-foreground">voordeliger de maandprijs</strong>.
                  Dit werkt als een staffelkorting:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  {[
                    { period: "1 maand", discount: "0%" },
                    { period: "6 maanden", discount: "5%" },
                    { period: "1 jaar", discount: "10%" },
                    { period: "3 jaar", discount: "15%" },
                    { period: "5 jaar", discount: "20%" },
                    { period: "10 jaar", discount: "25%" },
                  ].map(({ period, discount }) => (
                    <div key={period} className="bg-background/50 rounded-lg p-2.5 border border-border/50 text-center">
                      <p className="text-[10px] text-muted-foreground">{period}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">-{discount}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2 text-muted-foreground/70">
                  * Exacte kortingspercentages kunnen per ruimte verschillen. Neem contact op voor een offerte op maat.
                </p>
              </div>
            </div>

            {/* Resource-specifieke info */}
            {resource?.areaM2 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Details voor deze ruimte
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Oppervlakte</p>
                      <p className="text-lg font-bold">{parseFloat(resource.areaM2).toFixed(0)} m&sup2;</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type contract</p>
                      <p className="text-lg font-bold">{CONTRACT_TYPE_LABELS[resource.rozContractType || "kantoorruimte"] || "Kantoorruimte"}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Servicekosten model</p>
                      <p className="text-sm font-medium">{SERVICE_CHARGE_LABELS[resource.rozServiceChargeModel || "voorschot"] || "Voorschot"}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Indexatie</p>
                      <p className="text-sm font-medium">{INDEXATION_LABELS[resource.rozIndexation || "CPI"] || "CPI"} {resource.rozIndexation === "fixed_pct" && resource.rozIndexationPct ? `(${resource.rozIndexationPct}%)` : ""}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Huurbescherming</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        {resource.rozTenantProtection !== false ? (
                          <><CheckCircle2 className="w-4 h-4 text-green-500" /> Ja</>
                        ) : (
                          <><AlertTriangle className="w-4 h-4 text-amber-500" /> Nee</>
                        )}
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Opzegtermijn</p>
                      <p className="text-lg font-bold">{resource.rozNoticePeriodMonths ?? 3} maanden</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Disclaimer */}
            <div className="bg-muted/30 rounded-lg p-3 text-[11px] text-muted-foreground">
              <p>
                <strong>Let op:</strong> Deze informatie is een vereenvoudigde uitleg van de ROZ-huurovereenkomst.
                Het volledige contract met alle juridische voorwaarden wordt bij boeking automatisch opgestuurd.
                Raadpleeg bij twijfel altijd een juridisch adviseur.
                De ROZ-modellen zijn opgesteld door de Raad voor Onroerende Zaken (
                <a href="https://www.roz.nl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.roz.nl</a>).
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
