import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Globe, Search, Brain, Target, Mail, Phone, Calendar,
  FileText, Handshake, CheckCircle2, ArrowRight, ArrowDown,
  Sparkles, Users, TrendingUp, Zap, Building2, BarChart3,
  ChevronRight, Eye, MousePointer, Reply, Trophy, XCircle,
} from "lucide-react";

const FLOW_STEPS = [
  {
    id: "scrape",
    title: "1. Lead Scraping",
    subtitle: "Bronnen & Ontdekking",
    icon: Globe,
    color: "#627653",
    description: "Automatisch bedrijven vinden via LinkedIn, KvK, websites en events",
    metrics: [
      { label: "Bronnen actief", value: "4" },
      { label: "Leads gescraped", value: "156" },
      { label: "Deze maand", value: "+23" },
    ],
    details: [
      "LinkedIn Sales Navigator scraping",
      "KvK bedrijfsregistratie monitoring",
      "Website bezoeker identificatie",
      "Event deelnemerslijsten",
      "Partner referral tracking",
    ],
  },
  {
    id: "analysis",
    title: "2. Doelgroepanalyse",
    subtitle: "AI Scoring & Kwalificatie",
    icon: Brain,
    color: "#b8a472",
    description: "AI analyseert bedrijfsprofiel, industrie match, budget fit en locatievoorkeur",
    metrics: [
      { label: "Gekwalificeerd", value: "68%" },
      { label: "Gem. score", value: "62" },
      { label: "Top industrie", value: "Tech" },
    ],
    details: [
      "Bedrijfsgrootte & groeifase analyse",
      "Industrie-match scoring (tech, fintech, creative)",
      "Budget fit berekening",
      "Locatievoorkeur matching",
      "Competitor analyse (huidige werkplek)",
    ],
  },
  {
    id: "outreach",
    title: "3. Eerste Outreach",
    subtitle: "Gepersonaliseerde Campagnes",
    icon: Mail,
    color: "#8B7355",
    description: "AI-gegenereerde emails op basis van bedrijfsprofiel en trigger events",
    metrics: [
      { label: "Open rate", value: "58%" },
      { label: "Reply rate", value: "21%" },
      { label: "Campagnes", value: "4" },
    ],
    details: [
      "AI-gepersonaliseerde email templates",
      "Multi-step email sequences (3 touches)",
      "Trigger-based timing (funding, verhuizing, groei)",
      "A/B testing op subject lines",
      "Automatische follow-up bij geen reactie",
    ],
  },
  {
    id: "engage",
    title: "4. Engagement",
    subtitle: "Gesprek & Rondleiding",
    icon: Calendar,
    color: "#627653",
    description: "Van eerste reactie naar persoonlijk contact en rondleiding",
    metrics: [
      { label: "Tours gepland", value: "12" },
      { label: "Conversie", value: "75%" },
      { label: "Gem. doorlooptijd", value: "8d" },
    ],
    details: [
      "Automatische agenda-integratie",
      "Introductiegesprek (15 min call)",
      "Persoonlijke rondleiding op locatie",
      "Maatwerk presentatie per bedrijf",
      "Direct opvolging na tour",
    ],
  },
  {
    id: "convert",
    title: "5. Conversie",
    subtitle: "Voorstel & Afsluiting",
    icon: Handshake,
    color: "#b8a472",
    description: "Maatwerk voorstel, onderhandeling en contract afsluiting",
    metrics: [
      { label: "Win rate", value: "34%" },
      { label: "Gem. deal", value: "€144k" },
      { label: "Pipeline", value: "€2.1M" },
    ],
    details: [
      "Automatische offerte generatie",
      "Flexibele contractvoorwaarden",
      "Korting op jaarcontracten",
      "Onboarding planning",
      "Welcome package & community intro",
    ],
  },
];

export default function CrmMarketingFlow() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const { data: leads = [] } = trpc.crmLeads.list.useQuery({});
  const { data: stats } = trpc.crmLeads.pipelineStats.useQuery();
  const { data: campaigns = [] } = trpc.crmCampaigns.list.useQuery();

  // Map leads to flow stages
  const stageMapping: Record<string, string> = {
    new: "scrape",
    qualified: "analysis",
    tour_scheduled: "engage",
    proposal: "convert",
    negotiation: "convert",
    won: "convert",
    lost: "convert",
  };

  const leadsPerStep = useMemo(() => {
    const map: Record<string, typeof leads> = {};
    FLOW_STEPS.forEach((s) => (map[s.id] = []));
    leads.forEach((l) => {
      const step = stageMapping[l.stage] || "scrape";
      if (map[step]) map[step].push(l);
    });
    return map;
  }, [leads]);

  const activeCampaigns = campaigns.filter((c: any) => c.status === "active");

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Marketing Flow</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Van lead scraping tot member conversie — het complete acquisitieproces
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/crm")}>
            <BarChart3 className="w-4 h-4 mr-2" />Pipeline
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/crm/campaigns")}>
            <Mail className="w-4 h-4 mr-2" />Campagnes
          </Button>
        </div>
      </div>

      {/* Funnel Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#627653]/10">
                <Users className="w-5 h-5 text-[#627653]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Totaal Leads</p>
                <p className="text-xl font-semibold">{stats?.totalLeads || leads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#b8a472]/10">
                <TrendingUp className="w-5 h-5 text-[#b8a472]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pipeline Waarde</p>
                <p className="text-xl font-semibold">€{((stats?.totalValue || 0) / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Trophy className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversie Rate</p>
                <p className="text-xl font-semibold">{stats?.conversionRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Actieve Campagnes</p>
                <p className="text-xl font-semibold">{activeCampaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Flow Diagram */}
      <Card className="bg-card/50 border-border/30 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b8a472]" />
            Acquisitie Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {/* Desktop: horizontal flow */}
          <div className="hidden lg:flex items-start gap-0">
            {FLOW_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const stepLeads = leadsPerStep[step.id] || [];
              const isSelected = selectedStep === step.id;
              return (
                <div key={step.id} className="flex items-start flex-1">
                  <button
                    onClick={() => setSelectedStep(isSelected ? null : step.id)}
                    className={`flex-1 group cursor-pointer transition-all duration-200 ${isSelected ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
                  >
                    <div className={`rounded-xl p-4 border-2 transition-all ${isSelected ? "border-[color:var(--step-color)] bg-[color:var(--step-color)]/5" : "border-border/30 bg-card/30 hover:border-border/60"}`} style={{ "--step-color": step.color } as any}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: step.color + "20" }}>
                          <StepIcon className="w-5 h-5" style={{ color: step.color }} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold" style={{ color: step.color }}>{step.title}</p>
                          <p className="text-[10px] text-muted-foreground">{step.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground text-left mb-3 line-clamp-2">{step.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        {step.metrics.map((m) => (
                          <div key={m.label} className="bg-background/50 rounded px-2 py-1">
                            <p className="text-[9px] text-muted-foreground">{m.label}</p>
                            <p className="text-xs font-semibold">{m.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{stepLeads.length} leads</span>
                      </div>
                    </div>
                  </button>
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="flex items-center px-1 pt-10 flex-shrink-0">
                      <div className="w-6 h-px bg-border/50" />
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 -mx-1" />
                      <div className="w-6 h-px bg-border/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile: vertical flow */}
          <div className="lg:hidden space-y-3">
            {FLOW_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const stepLeads = leadsPerStep[step.id] || [];
              const isSelected = selectedStep === step.id;
              return (
                <div key={step.id}>
                  <button
                    onClick={() => setSelectedStep(isSelected ? null : step.id)}
                    className="w-full text-left"
                  >
                    <div className={`rounded-xl p-4 border-2 transition-all ${isSelected ? "border-[color:var(--step-color)] bg-[color:var(--step-color)]/5" : "border-border/30 bg-card/30"}`} style={{ "--step-color": step.color } as any}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: step.color + "20" }}>
                            <StepIcon className="w-5 h-5" style={{ color: step.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: step.color }}>{step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{stepLeads.length} leads</Badge>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {step.metrics.map((m) => (
                              <div key={m.label} className="bg-background/50 rounded px-2 py-1">
                                <p className="text-[9px] text-muted-foreground">{m.label}</p>
                                <p className="text-xs font-semibold">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Step Detail */}
      {selectedStep && (
        <div className="grid md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4">
          {/* Step Details */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {FLOW_STEPS.find((s) => s.id === selectedStep)?.title} — Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {FLOW_STEPS.find((s) => s.id === selectedStep)?.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#627653] mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{d}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Leads in this step */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Leads in deze fase</span>
                <Badge variant="outline">{(leadsPerStep[selectedStep] || []).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(leadsPerStep[selectedStep] || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Geen leads in deze fase</p>
                ) : (
                  (leadsPerStep[selectedStep] || []).map((lead: any) => (
                    <button
                      key={lead.id}
                      onClick={() => navigate(`/crm/leads/${lead.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#627653]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#627653]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.contactName} · {lead.industry}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-[#b8a472]">Score: {lead.score}</p>
                        <p className="text-[10px] text-muted-foreground">€{((lead.estimatedValue || 0) / 1000).toFixed(0)}k</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Performance */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#b8a472]" />
            Actieve Campagnes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.filter((c: any) => c.status === "active" || c.status === "completed").slice(0, 4).map((campaign: any) => (
              <div key={campaign.id} className="p-4 rounded-lg bg-background/50 border border-border/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium">{campaign.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{campaign.targetAudience}</p>
                  </div>
                  <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {campaign.status === "active" ? "Actief" : "Voltooid"}
                  </Badge>
                </div>
                {/* Funnel metrics */}
                <div className="flex items-center gap-1 text-[10px]">
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
                    <Mail className="w-3 h-3" />
                    <span>{campaign.sentCount}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
                    <Eye className="w-3 h-3" />
                    <span>{campaign.openCount}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
                    <MousePointer className="w-3 h-3" />
                    <span>{campaign.clickCount}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
                    <Reply className="w-3 h-3" />
                    <span>{campaign.replyCount}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                    <Trophy className="w-3 h-3" />
                    <span>{campaign.conversionCount}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Voortgang</span>
                    <span>{campaign.sentCount}/{campaign.totalLeads} verzonden</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#627653] transition-all"
                      style={{ width: `${(campaign.sentCount / Math.max(campaign.totalLeads, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trigger Events */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Trigger Events — Automatische Outreach
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { trigger: "Funding Ronde", desc: "Bedrijf haalt investering op → groei = meer kantoorruimte nodig", icon: TrendingUp, active: true, leads: 3 },
              { trigger: "Huurcontract Afloop", desc: "Huidig kantoor contract loopt af binnen 6 maanden", icon: Calendar, active: true, leads: 5 },
              { trigger: "Team Groei", desc: "LinkedIn toont 20%+ groei in medewerkers afgelopen kwartaal", icon: Users, active: true, leads: 8 },
              { trigger: "Verhuisaankondiging", desc: "Bedrijf kondigt verhuizing of nieuwe locatie aan", icon: Building2, active: false, leads: 0 },
              { trigger: "Competitor Switch", desc: "Bedrijf verlaat concurrent coworking space", icon: Target, active: true, leads: 2 },
              { trigger: "Event Deelname", desc: "Bedrijf bezoekt relevant tech/startup event", icon: Calendar, active: true, leads: 4 },
            ].map((t) => {
              const TIcon = t.icon;
              return (
                <div key={t.trigger} className={`p-3 rounded-lg border ${t.active ? "border-amber-500/20 bg-amber-500/5" : "border-border/20 bg-background/30 opacity-60"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TIcon className={`w-4 h-4 ${t.active ? "text-amber-500" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">{t.trigger}</span>
                    {t.active && <Badge className="text-[9px] ml-auto bg-amber-500/10 text-amber-500 border-amber-500/20">Actief</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                  {t.active && t.leads > 0 && (
                    <p className="text-[10px] text-amber-500 mt-2">{t.leads} leads getriggerd</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
