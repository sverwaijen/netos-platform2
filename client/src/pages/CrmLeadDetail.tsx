import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, DollarSign,
  Sparkles, Zap, Clock, MessageSquare, Send, Calendar, Target,
  TrendingUp, Trash2, Brain, RefreshCw, Users
} from "lucide-react";

const STAGES = ["new", "qualified", "tour_scheduled", "proposal", "negotiation", "won", "lost"] as const;
const STAGE_COLORS: Record<string, string> = {
  new: "#C4B89E", qualified: "#C4B89E", tour_scheduled: "#8B7355",
  proposal: "#C4B89E", negotiation: "#C4B89E", won: "#4a7c3f", lost: "#8a4444",
};

export default function CrmLeadDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const leadId = parseInt(params.id || "0");

  const { data: lead, refetch } = trpc.crmLeads.byId.useQuery({ id: leadId }, { enabled: leadId > 0 });
  const { data: activities = [] } = trpc.crmLeads.activities.useQuery({ leadId }, { enabled: leadId > 0 });

  const updateLead = trpc.crmLeads.update.useMutation({ onSuccess: () => { refetch(); toast.success("Lead updated"); } });
  const deleteLead = trpc.crmLeads.delete.useMutation({ onSuccess: () => { navigate("/crm"); toast.success("Lead deleted"); } });
  const addActivity = trpc.crmLeads.addActivity.useMutation({ onSuccess: () => { refetch(); toast.success("Activity added"); } });
  const aiScore = trpc.crmLeads.aiScore.useMutation({ onSuccess: (d) => { refetch(); toast.success(`AI Score: ${d.score}`); } });
  const aiSuggest = trpc.crmAgent.suggestNextAction.useMutation({ onSuccess: (d) => { setSuggestion(d); } });
  const aiEnrich = trpc.crmAgent.enrichLead.useMutation({ onSuccess: () => { refetch(); toast.success("Lead enriched"); } });

  const [noteText, setNoteText] = useState("");
  const [suggestion, setSuggestion] = useState<{ action: string; reason: string; priority: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#C4B89E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const startEdit = () => {
    setEditData({
      companyName: lead.companyName,
      contactName: lead.contactName || "",
      contactEmail: lead.contactEmail || "",
      contactPhone: lead.contactPhone || "",
      companySize: lead.companySize || "",
      industry: lead.industry || "",
      website: lead.website || "",
      locationPreference: lead.locationPreference || "",
      budgetRange: lead.budgetRange || "",
      estimatedValue: lead.estimatedValue || "",
      notes: lead.notes || "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateLead.mutate({ id: leadId, ...editData });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/crm")} className="text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> Pipeline
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Lead Info */}
        <div className="flex-1 space-y-4">
          <Card className="p-6 bg-white/[0.04] border-white/[0.08]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-semibold text-white">{lead.companyName}</h1>
                {lead.contactName && <p className="text-sm text-white/50 mt-1">{lead.contactName}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge style={{ backgroundColor: STAGE_COLORS[lead.stage] + "20", color: STAGE_COLORS[lead.stage], border: `1px solid ${STAGE_COLORS[lead.stage]}30` }}>
                  {lead.stage.replace("_", " ")}
                </Badge>
                {(lead.score ?? 0) > 0 && (
                  <Badge variant="secondary" className="bg-[#C4B89E]/10 text-[#C4B89E]">
                    <Zap className="w-3 h-3 mr-1" /> {lead.score}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stage Selector */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
              {STAGES.map((s, i) => (
                <button
                  key={s}
                  onClick={() => updateLead.mutate({ id: leadId, stage: s })}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-full transition-all whitespace-nowrap ${
                    lead.stage === s
                      ? "text-white"
                      : "text-white/40 hover:text-white/70 bg-white/[0.04]"
                  }`}
                  style={lead.stage === s ? { backgroundColor: STAGE_COLORS[s] } : {}}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Contact Info */}
            {!editing ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Mail, label: "Email", value: lead.contactEmail },
                  { icon: Phone, label: "Phone", value: lead.contactPhone },
                  { icon: Globe, label: "Website", value: lead.website },
                  { icon: Building2, label: "Industry", value: lead.industry },
                  { icon: Users, label: "Size", value: lead.companySize },
                  { icon: MapPin, label: "Location", value: lead.locationPreference },
                  { icon: DollarSign, label: "Est. Value", value: lead.estimatedValue ? `€${Number(lead.estimatedValue).toLocaleString()}` : null },
                  { icon: Target, label: "Budget", value: lead.budgetRange },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-[#C4B89E]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">{item.label}</p>
                      <p className="text-sm text-white">{item.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(editData).filter(([k]) => k !== "notes").map(([key, val]) => (
                  <div key={key}>
                    <Label className="text-[10px] uppercase tracking-wider text-white/40">{key.replace(/([A-Z])/g, " $1")}</Label>
                    <Input value={val as string} onChange={e => setEditData((p: any) => ({ ...p, [key]: e.target.value }))} className="mt-1 bg-white/[0.06] border-white/10 text-sm" />
                  </div>
                ))}
                <div className="col-span-2">
                  <Label className="text-[10px] uppercase tracking-wider text-white/40">Notes</Label>
                  <Textarea value={editData.notes} onChange={e => setEditData((p: any) => ({ ...p, notes: e.target.value }))} className="mt-1 bg-white/[0.06] border-white/10" rows={3} />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
              {!editing ? (
                <>
                  <Button size="sm" variant="outline" onClick={startEdit} className="border-white/10 text-white/70">Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => aiScore.mutate({ id: leadId })} disabled={aiScore.isPending} className="border-[#C4B89E]/30 text-[#C4B89E]">
                    <Zap className="w-3.5 h-3.5 mr-1" /> {aiScore.isPending ? "Scoring..." : "AI Score"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => aiEnrich.mutate({ leadId })} disabled={aiEnrich.isPending} className="border-[#C4B89E]/30 text-[#C4B89E]">
                    <Brain className="w-3.5 h-3.5 mr-1" /> {aiEnrich.isPending ? "Enriching..." : "AI Enrich"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => aiSuggest.mutate({ leadId })} disabled={aiSuggest.isPending} className="border-[#C4B89E]/30 text-[#C4B89E]">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> {aiSuggest.isPending ? "Thinking..." : "Suggest Action"}
                  </Button>
                  <div className="flex-1" />
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this lead?")) deleteLead.mutate({ id: leadId }); }} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={saveEdit} className="bg-[#C4B89E] hover:bg-[#1C1C1C] text-white">Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="border-white/10">Cancel</Button>
                </>
              )}
            </div>
          </Card>

          {/* AI Suggestion */}
          {suggestion && (
            <Card className="p-4 bg-[#C4B89E]/5 border-[#C4B89E]/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#C4B89E]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#C4B89E]">AI Recommendation</span>
                <Badge variant="outline" className={`text-[10px] ml-auto ${suggestion.priority === "high" ? "border-red-300 text-red-600" : suggestion.priority === "medium" ? "border-[#C4B89E] text-[#C4B89E]" : "border-white/10 text-white/40"}`}>
                  {suggestion.priority}
                </Badge>
              </div>
              <p className="text-sm font-medium text-white">{suggestion.action}</p>
              <p className="text-xs text-white/50 mt-1">{suggestion.reason}</p>
            </Card>
          )}

          {/* Notes */}
          {lead.notes && (
            <Card className="p-4 bg-white/[0.04] border-white/[0.08]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Notes</h3>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{lead.notes}</p>
            </Card>
          )}
        </div>

        {/* Right: Activity Timeline */}
        <div className="w-full lg:w-96 space-y-4">
          <Card className="p-4 bg-white/[0.04] border-white/[0.08]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Add Activity</h3>
            <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note or log an activity..." className="bg-white/[0.06] border-white/10 text-sm" rows={3} />
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" onClick={() => { addActivity.mutate({ leadId, type: "note", title: "Note", description: noteText }); setNoteText(""); }} disabled={!noteText || addActivity.isPending} className="bg-[#C4B89E] hover:bg-[#1C1C1C] text-white">
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Note
              </Button>
              <Button size="sm" variant="outline" onClick={() => { addActivity.mutate({ leadId, type: "call", title: "Phone call", description: noteText }); setNoteText(""); }} className="border-white/10 text-white/70">
                <Phone className="w-3.5 h-3.5 mr-1" /> Call
              </Button>
              <Button size="sm" variant="outline" onClick={() => { addActivity.mutate({ leadId, type: "email_sent", title: "Email sent", description: noteText }); setNoteText(""); }} className="border-white/10 text-white/70">
                <Send className="w-3.5 h-3.5 mr-1" /> Email
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-white/[0.04] border-white/[0.08]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Activity Timeline</h3>
            <div className="space-y-3">
              {activities.length === 0 && (
                <p className="text-xs text-white/30 text-center py-4">No activities yet</p>
              )}
              {activities.map((a: any) => (
                <div key={a.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      a.type === "stage_change" ? "bg-[#C4B89E]/20" :
                      a.type === "email_sent" ? "bg-blue-50" :
                      a.type === "call" ? "bg-green-50" :
                      a.type === "score_change" ? "bg-[#C4B89E]/10" :
                      "bg-white/[0.04]"
                    }`}>
                      {a.type === "stage_change" ? <TrendingUp className="w-3 h-3 text-[#C4B89E]" /> :
                       a.type === "email_sent" ? <Send className="w-3 h-3 text-blue-500" /> :
                       a.type === "call" ? <Phone className="w-3 h-3 text-green-600" /> :
                       a.type === "score_change" ? <Zap className="w-3 h-3 text-[#C4B89E]" /> :
                       <MessageSquare className="w-3 h-3 text-white/30" />}
                    </div>
                    <div className="w-px h-full bg-[#e8e6e1] mt-1" />
                  </div>
                  <div className="pb-3 flex-1">
                    <p className="text-sm font-medium text-white">{a.title}</p>
                    {a.description && <p className="text-xs text-white/50 mt-0.5">{a.description}</p>}
                    <p className="text-[10px] text-white/30 mt-1">
                      <Clock className="w-2.5 h-2.5 inline mr-1" />
                      {new Date(a.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
