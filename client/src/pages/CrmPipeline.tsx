import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Plus, Search, TrendingUp, Users, DollarSign, Target,
  Building2, Mail, Phone, Globe, ChevronRight, Sparkles,
  Filter, BarChart3, ArrowUpRight, Zap
} from "lucide-react";

const STAGES = [
  { key: "new", label: "New", color: "#627653" },
  { key: "qualified", label: "Qualified", color: "#b8a472" },
  { key: "tour_scheduled", label: "Tour", color: "#8B7355" },
  { key: "proposal", label: "Proposal", color: "#627653" },
  { key: "negotiation", label: "Negotiation", color: "#b8a472" },
  { key: "won", label: "Won", color: "#4a7c3f" },
  { key: "lost", label: "Lost", color: "#8a4444" },
] as const;

const SOURCES = ["website", "referral", "event", "cold_outreach", "linkedin", "partner", "inbound", "other"] as const;

export default function CrmPipeline() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { data: leads = [], refetch } = trpc.crmLeads.list.useQuery({ search: search || undefined, source: sourceFilter || undefined });
  const { data: stats } = trpc.crmLeads.pipelineStats.useQuery();
  const createLead = trpc.crmLeads.create.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); toast.success("Lead created"); } });
  const updateLead = trpc.crmLeads.update.useMutation({ onSuccess: () => { refetch(); toast.success("Lead updated"); } });

  const [newLead, setNewLead] = useState({ companyName: "", contactName: "", contactEmail: "", contactPhone: "", companySize: "", industry: "", website: "", locationPreference: "", budgetRange: "", source: "inbound" as typeof SOURCES[number], estimatedValue: "", notes: "" });

  const leadsByStage = useMemo(() => {
    const map: Record<string, typeof leads> = {};
    STAGES.forEach(s => { map[s.key] = []; });
    leads.forEach(l => { if (map[l.stage]) map[l.stage].push(l); });
    return map;
  }, [leads]);

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData("leadId", String(leadId));
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData("leadId"));
    if (leadId) {
      updateLead.mutate({ id: leadId, stage: stage as any });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Sales Pipeline</h1>
          <p className="text-sm text-white/50 mt-1 tracking-wide uppercase font-light">Manage leads and track conversions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-white/10 text-white/70" onClick={() => setShowStats(!showStats)}>
            <BarChart3 className="w-4 h-4 mr-2" /> Stats
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#627653] hover:bg-[#3a4a34] text-white">
                <Plus className="w-4 h-4 mr-2" /> New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-[#1a1a1a] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white font-semibold">Create New Lead</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="col-span-2">
                  <Label className="text-xs uppercase tracking-wider text-white/50">Company Name *</Label>
                  <Input value={newLead.companyName} onChange={e => setNewLead(p => ({ ...p, companyName: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Contact Name</Label>
                  <Input value={newLead.contactName} onChange={e => setNewLead(p => ({ ...p, contactName: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Email</Label>
                  <Input value={newLead.contactEmail} onChange={e => setNewLead(p => ({ ...p, contactEmail: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Phone</Label>
                  <Input value={newLead.contactPhone} onChange={e => setNewLead(p => ({ ...p, contactPhone: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Company Size</Label>
                  <Input value={newLead.companySize} onChange={e => setNewLead(p => ({ ...p, companySize: e.target.value }))} placeholder="e.g. 10-50" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Industry</Label>
                  <Input value={newLead.industry} onChange={e => setNewLead(p => ({ ...p, industry: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Website</Label>
                  <Input value={newLead.website} onChange={e => setNewLead(p => ({ ...p, website: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Location Preference</Label>
                  <Select value={newLead.locationPreference} onValueChange={v => setNewLead(p => ({ ...p, locationPreference: v }))}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["Amsterdam", "Apeldoorn", "Zwolle", "Rotterdam", "Ede", "Klarenbeek", "Spijkenisse"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Source</Label>
                  <Select value={newLead.source} onValueChange={v => setNewLead(p => ({ ...p, source: v as any }))}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-white/50">Est. Value (EUR)</Label>
                  <Input value={newLead.estimatedValue} onChange={e => setNewLead(p => ({ ...p, estimatedValue: e.target.value }))} placeholder="e.g. 12000" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs uppercase tracking-wider text-white/50">Notes</Label>
                  <Textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" rows={2} />
                </div>
              </div>
              <Button className="w-full mt-4 bg-[#627653] hover:bg-[#3a4a34] text-white" onClick={() => createLead.mutate(newLead)} disabled={!newLead.companyName || createLead.isPending}>
                {createLead.isPending ? "Creating..." : "Create Lead"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Bar */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total Leads", value: stats.totalLeads, icon: Users },
            { label: "Pipeline Value", value: `€${Number(stats.totalValue).toLocaleString()}`, icon: DollarSign },
            { label: "Won Value", value: `€${Number(stats.wonValue).toLocaleString()}`, icon: TrendingUp },
            { label: "Conversion", value: `${stats.conversionRate}%`, icon: Target },
            { label: "Avg Deal", value: `€${Number(stats.avgDealSize).toLocaleString()}`, icon: BarChart3 },
            { label: "Lost", value: stats.lostCount, icon: ArrowUpRight },
          ].map((s, i) => (
            <Card key={i} className="p-3 bg-white/[0.03] border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5 text-[#627653]" />
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{s.label}</span>
              </div>
              <p className="text-lg font-semibold text-white">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <Filter className="w-3.5 h-3.5 mr-2 text-white/40" />
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {STAGES.map(stage => (
          <div
            key={stage.key}
            className="flex-shrink-0 w-64"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, stage.key)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{stage.label}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] bg-white/[0.06] text-white/50 border-white/10">
                {leadsByStage[stage.key]?.length || 0}
              </Badge>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {(leadsByStage[stage.key] || []).map(lead => (
                <Card
                  key={lead.id}
                  draggable
                  onDragStart={e => handleDragStart(e, lead.id)}
                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                  className="p-3 bg-white/[0.04] border-white/[0.08] cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.12] transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white leading-tight">{lead.companyName}</h4>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-[#627653] transition-colors" />
                  </div>
                  {lead.contactName && (
                    <p className="text-xs text-white/50 mb-2">{lead.contactName}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {lead.estimatedValue && (
                      <Badge variant="outline" className="text-[10px] border-[#627653]/30 text-[#627653]">
                        €{Number(lead.estimatedValue).toLocaleString()}
                      </Badge>
                    )}
                    {lead.source && (
                      <Badge variant="secondary" className="text-[10px] bg-white/[0.06] text-white/40">
                        {lead.source.replace("_", " ")}
                      </Badge>
                    )}
                    {(lead.score ?? 0) > 0 && (
                      <Badge variant="secondary" className="text-[10px] bg-[#627653]/10 text-[#627653]">
                        <Zap className="w-2.5 h-2.5 mr-0.5" />{lead.score}
                      </Badge>
                    )}
                  </div>
                  {lead.locationPreference && (
                    <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wider">{lead.locationPreference}</p>
                  )}
                </Card>
              ))}

              {(leadsByStage[stage.key] || []).length === 0 && (
                <div className="border border-dashed border-white/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-white/30">No leads</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
