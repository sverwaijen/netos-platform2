import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Mail, Send, Play, Pause, Archive, Clock, Users,
  BarChart3, Sparkles, ChevronRight, Zap, Target, Eye,
  MousePointer, MessageSquare, Trash2
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "#111", active: "#627653", paused: "#b8a472", completed: "#4a7c3f", archived: "#888",
};

export default function CrmCampaigns() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "", type: "email_sequence" as const, targetAudience: "" });

  const { data: campaigns = [], refetch } = trpc.crmCampaigns.list.useQuery(statusFilter ? { status: statusFilter } : undefined);
  const createCampaign = trpc.crmCampaigns.create.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); toast.success("Campaign created"); } });
  const updateCampaign = trpc.crmCampaigns.update.useMutation({ onSuccess: () => { refetch(); toast.success("Campaign updated"); } });

  // Steps for selected campaign
  const { data: steps = [], refetch: refetchSteps } = trpc.crmCampaigns.steps.useQuery({ campaignId: selectedCampaign! }, { enabled: !!selectedCampaign });
  const { data: enrollments = [] } = trpc.crmCampaigns.enrollments.useQuery({ campaignId: selectedCampaign! }, { enabled: !!selectedCampaign });
  const addStep = trpc.crmCampaigns.addStep.useMutation({ onSuccess: () => { refetchSteps(); toast.success("Step added"); } });
  const deleteStep = trpc.crmCampaigns.deleteStep.useMutation({ onSuccess: () => { refetchSteps(); toast.success("Step removed"); } });

  // AI email generation
  const aiGenerate = trpc.crmTemplates.aiGenerate.useMutation();
  const [aiSubject, setAiSubject] = useState("");
  const [aiBody, setAiBody] = useState("");

  const selectedCampaignData = campaigns.find((c: any) => c.id === selectedCampaign);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Outreach Campaigns</h1>
          <p className="text-sm text-[#111]/50 mt-1 tracking-wide uppercase font-light">Automated email sequences & drip campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white border-[#e8e6e1]"><SelectValue placeholder="All status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {["draft", "active", "paused", "completed", "archived"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#627653] hover:bg-[#3a4a34] text-white">
                <Plus className="w-4 h-4 mr-2" /> New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#f6f5f2] border-[#e8e6e1]">
              <DialogHeader><DialogTitle className="text-[#111]">Create Campaign</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#111]/50">Campaign Name *</Label>
                  <Input value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-white border-[#e8e6e1]" placeholder="e.g. Q2 Enterprise Outreach" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#111]/50">Type</Label>
                  <Select value={newCampaign.type} onValueChange={v => setNewCampaign(p => ({ ...p, type: v as any }))}>
                    <SelectTrigger className="mt-1 bg-white border-[#e8e6e1]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_sequence">Email Sequence</SelectItem>
                      <SelectItem value="one_off">One-off Blast</SelectItem>
                      <SelectItem value="drip">Drip Campaign</SelectItem>
                      <SelectItem value="event">Event Invitation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#111]/50">Target Audience</Label>
                  <Input value={newCampaign.targetAudience} onChange={e => setNewCampaign(p => ({ ...p, targetAudience: e.target.value }))} className="mt-1 bg-white border-[#e8e6e1]" placeholder="e.g. Tech companies 10-50 employees" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#111]/50">Description</Label>
                  <Textarea value={newCampaign.description} onChange={e => setNewCampaign(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-white border-[#e8e6e1]" rows={2} />
                </div>
                <Button className="w-full bg-[#627653] hover:bg-[#3a4a34] text-white" onClick={() => createCampaign.mutate(newCampaign)} disabled={!newCampaign.name || createCampaign.isPending}>
                  {createCampaign.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Campaign List */}
        <div className="w-full lg:w-96 space-y-3">
          {campaigns.length === 0 && (
            <Card className="p-8 bg-white border-[#e8e6e1] text-center">
              <Mail className="w-8 h-8 text-[#111]/20 mx-auto mb-3" />
              <p className="text-sm text-[#111]/40">No campaigns yet</p>
              <p className="text-xs text-[#111]/30 mt-1">Create your first outreach campaign</p>
            </Card>
          )}
          {campaigns.map((c: any) => (
            <Card
              key={c.id}
              onClick={() => setSelectedCampaign(c.id)}
              className={`p-4 cursor-pointer transition-all ${selectedCampaign === c.id ? "bg-[#627653]/5 border-[#627653]/30" : "bg-white border-[#e8e6e1] hover:shadow-sm"}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#111]">{c.name}</h3>
                <Badge variant="outline" style={{ borderColor: STATUS_COLORS[c.status] + "40", color: STATUS_COLORS[c.status] }} className="text-[10px]">
                  {c.status}
                </Badge>
              </div>
              {c.description && <p className="text-xs text-[#111]/50 mb-2 line-clamp-1">{c.description}</p>}
              <div className="flex items-center gap-3 text-[10px] text-[#111]/30 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.totalLeads ?? 0}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {c.openRate ?? 0}%</span>
                <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" /> {c.clickRate ?? 0}%</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Campaign Detail */}
        {selectedCampaignData ? (
          <div className="flex-1 space-y-4">
            <Card className="p-6 bg-white border-[#e8e6e1]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#111]">{selectedCampaignData.name}</h2>
                  <p className="text-xs text-[#111]/40 mt-1">{selectedCampaignData.type?.replace("_", " ")} · {selectedCampaignData.targetAudience || "All leads"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCampaignData.status === "draft" && (
                    <Button size="sm" onClick={() => updateCampaign.mutate({ id: selectedCampaignData.id, status: "active" })} className="bg-[#627653] hover:bg-[#3a4a34] text-white">
                      <Play className="w-3.5 h-3.5 mr-1" /> Launch
                    </Button>
                  )}
                  {selectedCampaignData.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => updateCampaign.mutate({ id: selectedCampaignData.id, status: "paused" })} className="border-[#b8a472]/30 text-[#b8a472]">
                      <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                    </Button>
                  )}
                  {selectedCampaignData.status === "paused" && (
                    <Button size="sm" onClick={() => updateCampaign.mutate({ id: selectedCampaignData.id, status: "active" })} className="bg-[#627653] hover:bg-[#3a4a34] text-white">
                      <Play className="w-3.5 h-3.5 mr-1" /> Resume
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Enrolled", value: selectedCampaignData.totalLeads ?? 0, icon: Users },
                  { label: "Sent", value: (selectedCampaignData as any).totalSent ?? 0, icon: Send },
                  { label: "Open Rate", value: `${(selectedCampaignData as any).openRate ?? 0}%`, icon: Eye },
                  { label: "Click Rate", value: `${(selectedCampaignData as any).clickRate ?? 0}%`, icon: MousePointer },
                ].map((s, i) => (
                  <div key={i} className="bg-[#f6f5f2] rounded-lg p-3">
                    <s.icon className="w-3.5 h-3.5 text-[#627653] mb-1" />
                    <p className="text-lg font-semibold text-[#111]">{s.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#111]/30">{s.label}</p>
                  </div>
                ))}
              </div>

              <Tabs defaultValue="steps">
                <TabsList className="bg-[#f6f5f2] border border-[#e8e6e1]">
                  <TabsTrigger value="steps" className="text-xs">Email Steps</TabsTrigger>
                  <TabsTrigger value="enrollments" className="text-xs">Enrolled Leads</TabsTrigger>
                </TabsList>

                <TabsContent value="steps" className="mt-4 space-y-3">
                  {steps.map((step: any, i: number) => (
                    <Card key={step.id} className="p-4 bg-[#f6f5f2] border-[#e8e6e1]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#627653] text-white flex items-center justify-center text-xs font-semibold">{i + 1}</div>
                          <span className="text-xs text-[#111]/40">
                            {step.delayDays > 0 ? `Wait ${step.delayDays} day${step.delayDays > 1 ? "s" : ""}` : "Immediate"}
                          </span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteStep.mutate({ id: step.id })} className="text-[#111]/30 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <p className="text-sm font-medium text-[#111]">{step.subject || "No subject"}</p>
                      {step.body && <p className="text-xs text-[#111]/50 mt-1 line-clamp-2">{step.body.replace(/<[^>]*>/g, "")}</p>}
                    </Card>
                  ))}

                  {/* Add Step */}
                  <Card className="p-4 border-dashed border-[#e8e6e1] bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#111]/40">Add Email Step</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const result = await aiGenerate.mutateAsync({ campaignType: selectedCampaignData.type || "introduction", tone: "professional" });
                          setAiSubject(result.subject);
                          setAiBody(result.body);
                        }}
                        disabled={aiGenerate.isPending}
                        className="border-[#627653]/30 text-[#627653]"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> {aiGenerate.isPending ? "Generating..." : "AI Write"}
                      </Button>
                    </div>
                    <Input value={aiSubject} onChange={e => setAiSubject(e.target.value)} placeholder="Subject line..." className="mb-2 bg-[#f6f5f2] border-[#e8e6e1]" />
                    <Textarea value={aiBody} onChange={e => setAiBody(e.target.value)} placeholder="Email body..." className="bg-[#f6f5f2] border-[#e8e6e1]" rows={4} />
                    <Button
                      size="sm"
                      className="mt-2 bg-[#627653] hover:bg-[#3a4a34] text-white"
                      onClick={() => {
                        addStep.mutate({ campaignId: selectedCampaign!, stepOrder: steps.length + 1, delayDays: steps.length === 0 ? 0 : 3, subject: aiSubject, body: aiBody });
                        setAiSubject(""); setAiBody("");
                      }}
                      disabled={!aiSubject || addStep.isPending}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Step
                    </Button>
                  </Card>
                </TabsContent>

                <TabsContent value="enrollments" className="mt-4">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-8 h-8 text-[#111]/20 mx-auto mb-2" />
                      <p className="text-sm text-[#111]/40">No leads enrolled yet</p>
                      <p className="text-xs text-[#111]/30 mt-1">Enroll leads from the pipeline</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {enrollments.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-[#f6f5f2] rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-[#111]">{e.leadName}</p>
                            <p className="text-xs text-[#111]/40">{e.contactName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-[#e8e6e1] text-[#111]/40">
                              Step {e.currentStep ?? 1}
                            </Badge>
                            <Badge variant="secondary" className={`text-[10px] ${e.status === "active" ? "bg-[#627653]/10 text-[#627653]" : "bg-[#f6f5f2] text-[#111]/40"}`}>
                              {e.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="w-12 h-12 text-[#111]/10 mx-auto mb-3" />
              <p className="text-sm text-[#111]/30">Select a campaign to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
