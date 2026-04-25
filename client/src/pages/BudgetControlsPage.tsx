import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Shield, Plus, User, Users, MapPin, Layers, AlertTriangle, Trash2 } from "lucide-react";

const CONTROL_TYPES = [
  { value: "per_employee_cap", label: "Per-Employee Cap", icon: User, description: "Limit credits per employee per period" },
  { value: "team_budget", label: "Team Budget", icon: Users, description: "Shared budget for a team or department" },
  { value: "location_restriction", label: "Location Restriction", icon: MapPin, description: "Credits only valid at specific locations" },
  { value: "resource_type_restriction", label: "Resource Type", icon: Layers, description: "Credits only for specific resource types" },
  { value: "approval_threshold", label: "Approval Required", icon: AlertTriangle, description: "Large bookings require manager approval" },
] as const;

const PERIOD_LABELS: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

export default function BudgetControlsPage() {
  const { data: companies } = trpc.companies.list.useQuery();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const { data: controls, isLoading } = trpc.budgetControls.byCompany.useQuery(
    { companyId: selectedCompanyId! },
    { enabled: !!selectedCompanyId },
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [formType, setFormType] = useState("per_employee_cap");
  const [formCap, setFormCap] = useState("500");
  const [formPeriod, setFormPeriod] = useState("monthly");
  const [formTeam, setFormTeam] = useState("");
  const [formThreshold, setFormThreshold] = useState("100");

  const utils = trpc.useUtils();
  const createMutation = trpc.budgetControls.create.useMutation({
    onSuccess: () => { toast.success("Budget control created."); setCreateOpen(false); utils.budgetControls.byCompany.invalidate(); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteMutation = trpc.budgetControls.delete.useMutation({
    onSuccess: () => { toast.success("Control removed."); utils.budgetControls.byCompany.invalidate(); },
    onError: (err: any) => toast.error(err.message),
  });

  // Auto-select first company
  if (!selectedCompanyId && companies && companies.length > 0) {
    setSelectedCompanyId(companies[0].id);
  }

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Enterprise</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Budget <strong className="font-semibold">controls.</strong>
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedCompanyId ?? ""}
            onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
            className="bg-[#111] border border-white/10 text-sm px-3 py-2 rounded-sm text-white"
          >
            {(companies ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#627653] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all">
            <Plus className="w-3.5 h-3.5" />Add Control
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-[1px] bg-white/[0.04]">
        {CONTROL_TYPES.map((ct) => (
          <div key={ct.value} className="bg-[#111] p-4">
            <ct.icon className="w-4 h-4 text-[#627653] mb-2" />
            <div className="text-xs font-medium mb-1">{ct.label}</div>
            <div className="text-[11px] text-[#888] font-light">{ct.description}</div>
          </div>
        ))}
      </div>

      {/* Controls list */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (controls ?? []).length === 0 ? (
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-12 text-center">
            <Shield className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
            <p className="text-sm text-[#888] font-light">No budget controls configured yet.</p>
            <p className="text-[12px] text-[#888] font-light mt-1">Create controls to manage spending limits for employees and teams.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-[1px] bg-white/[0.04]">
          {(controls ?? []).map((ctrl: any) => {
            const ctInfo = CONTROL_TYPES.find(ct => ct.value === ctrl.controlType) || CONTROL_TYPES[0];
            const CtIcon = ctInfo.icon;
            return (
              <div key={ctrl.id} className="bg-[#111] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-[#627653]/10 flex items-center justify-center">
                    <CtIcon className="w-4 h-4 text-[#627653]" />
                  </div>
                  <div>
                    <div className="text-sm font-light">{ctInfo.label}</div>
                    <div className="text-[11px] text-[#888] font-light">
                      {ctrl.capAmount && `Cap: ${parseFloat(ctrl.capAmount).toFixed(0)} credits`}
                      {ctrl.targetTeam && ` \u00b7 Team: ${ctrl.targetTeam}`}
                      {ctrl.approvalThreshold && `Threshold: ${parseFloat(ctrl.approvalThreshold).toFixed(0)} credits`}
                      {ctrl.periodType && ` \u00b7 ${PERIOD_LABELS[ctrl.periodType] || ctrl.periodType}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ctrl.capAmount && (
                    <div className="text-right">
                      <div className="text-sm font-light">{parseFloat(ctrl.currentSpend ?? "0").toFixed(0)} / {parseFloat(ctrl.capAmount).toFixed(0)}</div>
                      <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#627653] rounded-full" style={{ width: `${Math.min((parseFloat(ctrl.currentSpend ?? "0") / parseFloat(ctrl.capAmount)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  <button onClick={() => deleteMutation.mutate({ id: ctrl.id })} className="text-[#888] hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">New Budget Control</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Control Type</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="mt-1 w-full bg-white/[0.03] border border-white/[0.06] text-sm px-3 py-2 rounded-sm text-white">
                {CONTROL_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </div>
            {(formType === "per_employee_cap" || formType === "team_budget") && (
              <>
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Credit Cap</label>
                  <Input type="number" value={formCap} onChange={(e) => setFormCap(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Period</label>
                  <select value={formPeriod} onChange={(e) => setFormPeriod(e.target.value)} className="mt-1 w-full bg-white/[0.03] border border-white/[0.06] text-sm px-3 py-2 rounded-sm text-white">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </>
            )}
            {formType === "team_budget" && (
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Team Name</label>
                <Input value={formTeam} onChange={(e) => setFormTeam(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" placeholder="e.g. Engineering" />
              </div>
            )}
            {formType === "approval_threshold" && (
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Approval Threshold (credits)</label>
                <Input type="number" value={formThreshold} onChange={(e) => setFormThreshold(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                <p className="text-[11px] text-[#888] mt-1">Bookings above this amount require manager approval</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-white/10 bg-transparent">Cancel</Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => {
                if (!selectedCompanyId) return;
                createMutation.mutate({
                  companyId: selectedCompanyId,
                  controlType: formType as any,
                  capAmount: (formType === "per_employee_cap" || formType === "team_budget") ? formCap : undefined,
                  periodType: (formType === "per_employee_cap" || formType === "team_budget") ? formPeriod as any : undefined,
                  targetTeam: formType === "team_budget" ? formTeam : undefined,
                  approvalThreshold: formType === "approval_threshold" ? formThreshold : undefined,
                });
              }}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createMutation.isPending ? "Creating..." : "Create Control"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
