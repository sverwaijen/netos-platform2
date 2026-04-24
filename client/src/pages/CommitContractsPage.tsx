import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileSignature, Plus, TrendingUp, Calendar, AlertTriangle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-white/10 text-[#888]",
  pending_approval: "bg-amber-500/10 text-amber-400",
  active: "bg-[#627653]/10 text-[#627653]",
  paused: "bg-blue-500/10 text-blue-400",
  expired: "bg-red-500/10 text-red-400",
  terminated: "bg-red-500/10 text-red-400",
};

export default function CommitContractsPage() {
  const { data: companies } = trpc.companies.list.useQuery();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const { data: contracts, isLoading } = trpc.commitContracts.byCompany.useQuery(
    { companyId: selectedCompanyId! },
    { enabled: !!selectedCompanyId },
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCredits, setFormCredits] = useState("10000");
  const [formEur, setFormEur] = useState("9000");
  const [formMonths, setFormMonths] = useState("24");
  const [formMonthly, setFormMonthly] = useState("");
  const [formDiscount, setFormDiscount] = useState("30");
  const [formPrepaid, setFormPrepaid] = useState("0");

  const utils = trpc.useUtils();
  const createMutation = trpc.commitContracts.create.useMutation({
    onSuccess: () => { toast.success("Commit contract created."); setCreateOpen(false); utils.commitContracts.byCompany.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  if (!selectedCompanyId && companies && companies.length > 0) {
    setSelectedCompanyId(companies[0].id);
  }

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Enterprise</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Commit <strong className="font-semibold">contracts.</strong>
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedCompanyId ?? ""}
            onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
            className="bg-[#111] border border-white/10 text-sm px-3 py-2 rounded-sm text-white"
          >
            {(companies ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#627653] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all">
            <Plus className="w-3.5 h-3.5" />New Contract
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (contracts ?? []).length === 0 ? (
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-12 text-center">
            <FileSignature className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
            <p className="text-sm text-[#888] font-light">No commit contracts yet.</p>
            <p className="text-[12px] text-[#888] font-light mt-1">Enterprise commit contracts provide volume discounts for guaranteed usage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(contracts ?? []).map((contract) => {
            const used = parseFloat(contract.drawdownUsed ?? "0");
            const total = parseFloat(contract.totalCommitCredits);
            const utilPct = total > 0 ? (used / total) * 100 : 0;
            const elapsed = Date.now() - (contract.startDate ?? Date.now());
            const duration = (contract.endDate ?? Date.now()) - (contract.startDate ?? Date.now());
            const timePct = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;
            const onTrack = utilPct >= timePct * 0.8;

            return (
              <Card key={contract.id} className="bg-[#111] border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-light">{contract.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-semibold tracking-[2px] uppercase px-2 py-0.5 rounded-sm ${STATUS_COLORS[contract.status] || STATUS_COLORS.draft}`}>
                          {contract.status?.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-[#888] font-light">{contract.commitPeriodMonths} months</span>
                        {parseFloat(contract.discountPercent ?? "0") > 0 && (
                          <span className="text-[11px] text-[#627653] font-medium">{parseFloat(contract.discountPercent ?? "0").toFixed(0)}% discount</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extralight">{total.toLocaleString()}<span className="text-sm text-[#888] ml-1">credits</span></div>
                      {contract.totalCommitEur && <div className="text-[11px] text-[#888]">\u20AC{parseFloat(contract.totalCommitEur).toLocaleString()}</div>}
                    </div>
                  </div>

                  {/* Drawdown progress */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#888]">Credit Drawdown</span>
                        <span className="font-medium">{used.toLocaleString()} / {total.toLocaleString()} ({utilPct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-[#627653] rounded-full transition-all duration-500" style={{ width: `${utilPct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#888]">Time Elapsed</span>
                        <span className="font-medium">{timePct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-[#b8a472] rounded-full transition-all duration-500" style={{ width: `${timePct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center gap-4 mt-4 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className={`w-3.5 h-3.5 ${onTrack ? "text-[#627653]" : "text-amber-400"}`} />
                      <span className={onTrack ? "text-[#627653]" : "text-amber-400"}>{onTrack ? "On track" : "Below target"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#888]">
                      <Calendar className="w-3.5 h-3.5" />
                      {contract.startDate && new Date(contract.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                      {" \u2013 "}
                      {contract.endDate && new Date(contract.endDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    {contract.trueUpEnabled && (
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />True-up enabled
                      </div>
                    )}
                    {parseFloat(contract.prepaidAmount ?? "0") > 0 && (
                      <div className="text-[#888]">Prepaid: \u20AC{parseFloat(contract.prepaidAmount ?? "0").toLocaleString()}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">New Commit Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Contract Name</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" placeholder="e.g. Company X Annual 2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Total Credits</label>
                <Input type="number" value={formCredits} onChange={(e) => setFormCredits(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Total EUR</label>
                <Input type="number" value={formEur} onChange={(e) => setFormEur(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Duration (months)</label>
                <Input type="number" value={formMonths} onChange={(e) => setFormMonths(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Discount %</label>
                <Input type="number" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Monthly Allocation (credits)</label>
              <Input type="number" value={formMonthly} onChange={(e) => setFormMonthly(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" placeholder="Auto-calculated if empty" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Prepaid Amount (EUR)</label>
              <Input type="number" value={formPrepaid} onChange={(e) => setFormPrepaid(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-white/10 bg-transparent">Cancel</Button>
            <Button
              disabled={createMutation.isPending || !formName || !formCredits}
              onClick={() => {
                if (!selectedCompanyId) return;
                const now = Date.now();
                const months = parseInt(formMonths) || 24;
                const endDate = now + months * 30 * 24 * 60 * 60 * 1000;
                createMutation.mutate({
                  companyId: selectedCompanyId,
                  name: formName,
                  totalCommitCredits: formCredits,
                  totalCommitEur: formEur || undefined,
                  commitPeriodMonths: months,
                  startDate: now,
                  endDate,
                  discountPercent: formDiscount || undefined,
                  prepaidAmount: formPrepaid || undefined,
                  monthlyAllocation: formMonthly || (parseFloat(formCredits) / months).toFixed(2),
                });
              }}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createMutation.isPending ? "Creating..." : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
