import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertTriangle, Shield, Clock, CheckCircle2, ArrowUpRight,
  Plus, Settings, Activity, TrendingUp, Zap,
} from "lucide-react";

type EscalationStatus = "triggered" | "acknowledged" | "resolved" | "expired";

export default function EscalationDashboard() {
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.escalationLog.dashboard.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );
  const { data: escalations = [], isLoading: escalationsLoading } = trpc.escalationLog.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );
  const { data: rules = [] } = trpc.escalationRules.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [acknowledgeId, setAcknowledgeId] = useState<number | null>(null);
  const [workaround, setWorkaround] = useState("");

  const utils = trpc.useUtils();

  const acknowledgeMutation = trpc.escalationLog.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("Escalatie bevestigd");
      setAcknowledgeId(null);
      setWorkaround("");
      utils.escalationLog.list.invalidate();
      utils.escalationLog.dashboard.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resolveMutation = trpc.escalationLog.resolve.useMutation({
    onSuccess: () => {
      toast.success("Escalatie opgelost");
      utils.escalationLog.list.invalidate();
      utils.escalationLog.dashboard.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const checkEscalationsMutation = trpc.escalationLog.checkEscalations.useMutation({
    onSuccess: (data) => {
      if (data.triggered > 0) {
        toast.warning(`${data.triggered} nieuwe escalatie(s) getriggerd`);
      } else {
        toast.success("Geen nieuwe escalaties");
      }
      utils.escalationLog.list.invalidate();
      utils.escalationLog.dashboard.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createRuleMutation = trpc.escalationRules.create.useMutation({
    onSuccess: () => {
      toast.success("Escalatieregel aangemaakt");
      setCreateRuleOpen(false);
      utils.escalationRules.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Form state for creating rules
  const [newRule, setNewRule] = useState({
    name: "",
    escalateAfterMinutes: 60,
    triggerType: "no_response" as const,
    escalationLevel: 1,
    escalateToRole: "host" as const,
    autoPriorityBump: false,
    autoReassign: false,
  });

  const statusColor: Record<EscalationStatus, string> = {
    triggered: "text-red-400",
    acknowledged: "text-amber-400",
    resolved: "text-[#627653]",
    expired: "text-[#888]",
  };

  const statusBg: Record<EscalationStatus, string> = {
    triggered: "bg-red-500/10",
    acknowledged: "bg-amber-500/10",
    resolved: "bg-[#627653]/10",
    expired: "bg-white/[0.03]",
  };

  const levelLabel = (level: number) => {
    switch (level) {
      case 1: return "Facility";
      case 2: return "Host";
      case 3: return "Administrator";
      default: return `Level ${level}`;
    }
  };

  if (statsLoading || escalationsLoading) {
    return (
      <div className="space-y-4 p-1">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Operations</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Incident <strong className="font-semibold">escalaties.</strong>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => checkEscalationsMutation.mutate()}
            disabled={checkEscalationsMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-white/5 transition-all"
          >
            <Activity className="w-3.5 h-3.5" />
            {checkEscalationsMutation.isPending ? "Checking..." : "Check Nu"}
          </button>
          <button
            onClick={() => setCreateRuleOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-[#627653] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />Nieuwe Regel
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Actieve Escalaties", value: stats?.activeEscalations ?? 0, icon: AlertTriangle, color: stats?.activeEscalations ? "#ef4444" : "#627653" },
          { label: "Vandaag Getriggerd", value: stats?.triggeredToday ?? 0, icon: Zap, color: "#b8a472" },
          { label: "Bevestigd", value: stats?.acknowledgedToday ?? 0, icon: Shield, color: "#4a7c8a" },
          { label: "Opgelost", value: stats?.resolvedToday ?? 0, icon: CheckCircle2, color: "#627653" },
          { label: "SLA Overschreden", value: stats?.breachedSla ?? 0, icon: Clock, color: stats?.breachedSla ? "#ef4444" : "#888" },
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-4 flex items-center gap-3">
            <item.icon className="w-5 h-5 shrink-0" style={{ color: item.color }} />
            <div>
              <div className="text-[9px] text-[#888] tracking-[1px] uppercase">{item.label}</div>
              <div className="text-2xl font-extralight">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* By level breakdown */}
      {stats?.byLevel && stats.byLevel.length > 0 && (
        <div className="grid grid-cols-3 gap-[1px] bg-white/[0.04]">
          {[1, 2, 3].map((level) => {
            const data = stats.byLevel.find((b: any) => b.level === level);
            return (
              <div key={level} className="bg-[#111] p-4">
                <div className="text-[9px] text-[#888] tracking-[1px] uppercase mb-1">{levelLabel(level)}</div>
                <div className="text-xl font-extralight">{data?.count ?? 0}</div>
                <div className="text-[11px] text-[#888]">actieve escalaties</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active escalations */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Overzicht</div>
          <h3 className="text-lg font-extralight mb-6">Recente <strong className="font-semibold">escalaties.</strong></h3>

          {escalations.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-8 h-8 text-[#627653] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Geen escalaties. Alles onder controle.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {escalations.map((esc: any) => (
                <div key={esc.id} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${statusBg[esc.status as EscalationStatus]}`}>
                      {esc.status === "triggered" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      ) : esc.status === "acknowledged" ? (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#627653]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-light">{esc.reason || "Escalatie"}</p>
                      <p className="text-[11px] text-[#888]">
                        Ticket #{esc.ticketId} &middot; Level {esc.escalationLevel} ({levelLabel(esc.escalationLevel)})
                        {esc.slaBreach && <span className="text-red-400 ml-2">SLA breach</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium capitalize ${statusColor[esc.status as EscalationStatus]}`}>
                      {esc.status === "triggered" ? "Open" : esc.status === "acknowledged" ? "Bevestigd" : esc.status === "resolved" ? "Opgelost" : "Verlopen"}
                    </span>
                    {esc.status === "triggered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-7 border-white/10 bg-transparent hover:bg-white/5"
                        onClick={() => setAcknowledgeId(esc.id)}
                      >
                        Bevestig
                      </Button>
                    )}
                    {esc.status === "acknowledged" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-7 border-[#627653]/30 text-[#627653] bg-transparent hover:bg-[#627653]/10"
                        onClick={() => resolveMutation.mutate({ id: esc.id })}
                      >
                        Oplossen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalation rules */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Configuratie</div>
          <h3 className="text-lg font-extralight mb-6">Escalatie<strong className="font-semibold">regels.</strong></h3>

          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-6 h-6 text-[#888] mx-auto mb-2 opacity-30" />
              <p className="text-sm text-[#888] font-light">Nog geen escalatieregels geconfigureerd.</p>
              <Button
                variant="outline"
                className="mt-4 border-white/10 bg-transparent text-[10px] tracking-[2px] uppercase"
                onClick={() => setCreateRuleOpen(true)}
              >
                Eerste regel aanmaken
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {rules.map((rule: any) => (
                <div key={rule.id} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0">
                  <div>
                    <p className="text-sm font-light">{rule.name}</p>
                    <p className="text-[11px] text-[#888]">
                      {rule.triggerType?.replace(/_/g, " ")} na {rule.escalateAfterMinutes} min
                      &middot; Level {rule.escalationLevel}
                      {rule.autoPriorityBump && " \u2022 Auto prioriteit"}
                      {rule.autoReassign && " \u2022 Auto toewijzing"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium ${rule.isActive ? "text-[#627653]" : "text-[#888]"}`}>
                    {rule.isActive ? "Actief" : "Inactief"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acknowledge dialog */}
      <Dialog open={acknowledgeId !== null} onOpenChange={() => setAcknowledgeId(null)}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">Escalatie bevestigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Workaround / tijdelijke oplossing</label>
              <Input
                value={workaround}
                onChange={(e) => setWorkaround(e.target.value)}
                placeholder="Optioneel: beschrijf een tijdelijke oplossing"
                className="mt-1 bg-white/[0.03] border-white/[0.06]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcknowledgeId(null)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              disabled={acknowledgeMutation.isPending}
              onClick={() => {
                if (acknowledgeId) {
                  acknowledgeMutation.mutate({ id: acknowledgeId, workaround: workaround || undefined });
                }
              }}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {acknowledgeMutation.isPending ? "Bezig..." : "Bevestigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create rule dialog */}
      <Dialog open={createRuleOpen} onOpenChange={setCreateRuleOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">Nieuwe escalatieregel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Bijv. Urgent ticket zonder reactie"
                className="mt-1 bg-white/[0.03] border-white/[0.06]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Trigger</label>
              <select
                value={newRule.triggerType}
                onChange={(e) => setNewRule({ ...newRule, triggerType: e.target.value as any })}
                className="mt-1 w-full bg-white/[0.03] border border-white/[0.06] text-white p-2 text-sm"
              >
                <option value="no_response">Geen reactie</option>
                <option value="no_resolution">Niet opgelost</option>
                <option value="sla_breach">SLA overschreden</option>
                <option value="priority_change">Prioriteit gewijzigd</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Na (minuten)</label>
                <Input
                  type="number"
                  value={newRule.escalateAfterMinutes}
                  onChange={(e) => setNewRule({ ...newRule, escalateAfterMinutes: parseInt(e.target.value) || 60 })}
                  className="mt-1 bg-white/[0.03] border-white/[0.06]"
                  min={1}
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Escalatieniveau</label>
                <select
                  value={newRule.escalationLevel}
                  onChange={(e) => setNewRule({ ...newRule, escalationLevel: parseInt(e.target.value) })}
                  className="mt-1 w-full bg-white/[0.03] border border-white/[0.06] text-white p-2 text-sm"
                >
                  <option value={1}>Level 1 - Facility</option>
                  <option value={2}>Level 2 - Host</option>
                  <option value={3}>Level 3 - Administrator</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[#888]">
                <input
                  type="checkbox"
                  checked={newRule.autoPriorityBump}
                  onChange={(e) => setNewRule({ ...newRule, autoPriorityBump: e.target.checked })}
                  className="accent-[#627653]"
                />
                Auto prioriteit verhogen
              </label>
              <label className="flex items-center gap-2 text-sm text-[#888]">
                <input
                  type="checkbox"
                  checked={newRule.autoReassign}
                  onChange={(e) => setNewRule({ ...newRule, autoReassign: e.target.checked })}
                  className="accent-[#627653]"
                />
                Auto toewijzen
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRuleOpen(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              disabled={!newRule.name || createRuleMutation.isPending}
              onClick={() => createRuleMutation.mutate(newRule)}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createRuleMutation.isPending ? "Bezig..." : "Aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
