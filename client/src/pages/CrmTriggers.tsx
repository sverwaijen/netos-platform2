import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Zap, Plus, Play, Pause, Trash2, Settings, Activity,
  Brain, Mail, UserPlus, Tag, ArrowRight, Eye, Clock
} from "lucide-react";

const EVENT_TYPES = [
  { value: "lead_created", label: "Lead Aangemaakt", icon: UserPlus, color: "text-green-400" },
  { value: "stage_change", label: "Stage Wijziging", icon: ArrowRight, color: "text-blue-400" },
  { value: "website_visit", label: "Website Bezoek", icon: Eye, color: "text-purple-400" },
  { value: "form_submit", label: "Formulier Ingevuld", icon: Mail, color: "text-orange-400" },
  { value: "email_opened", label: "Email Geopend", icon: Mail, color: "text-cyan-400" },
  { value: "email_replied", label: "Email Beantwoord", icon: Mail, color: "text-emerald-400" },
  { value: "inactivity", label: "Inactiviteit", icon: Clock, color: "text-red-400" },
  { value: "score_threshold", label: "Score Drempel", icon: Activity, color: "text-yellow-400" },
  { value: "tag_added", label: "Tag Toegevoegd", icon: Tag, color: "text-pink-400" },
  { value: "manual", label: "Handmatig", icon: Play, color: "text-gray-400" },
];

const ACTION_TYPES = [
  { value: "ai_enrich", label: "AI Verrijking", desc: "Verrijk lead data met AI" },
  { value: "ai_score", label: "AI Scoring", desc: "Bereken lead score met AI" },
  { value: "ai_outreach", label: "AI Outreach", desc: "Genereer persoonlijke outreach" },
  { value: "ai_analyze", label: "AI Analyse", desc: "Diepte-analyse van lead" },
  { value: "assign_user", label: "Toewijzen", desc: "Wijs toe aan teamlid" },
  { value: "change_stage", label: "Stage Wijzigen", desc: "Verplaats naar andere stage" },
  { value: "add_tag", label: "Tag Toevoegen", desc: "Voeg tag toe aan lead" },
  { value: "send_email", label: "Email Sturen", desc: "Stuur automatische email" },
  { value: "notify_owner", label: "Notificatie", desc: "Stuur notificatie naar eigenaar" },
  { value: "create_task", label: "Taak Aanmaken", desc: "Maak follow-up taak aan" },
];

export default function CrmTriggers() {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEvent, setNewEvent] = useState("lead_created");
  const [newActions, setNewActions] = useState<Array<{ type: string; config: Record<string, any> }>>([]);
  const [showLogs, setShowLogs] = useState<number | null>(null);

  const { data: triggers, refetch } = trpc.crmTriggers.list.useQuery();
  const { data: logs } = trpc.crmTriggers.logs.useQuery(
    showLogs ? { triggerId: showLogs, limit: 20 } : { limit: 50 },
    { enabled: showLogs !== null }
  );

  const createMut = trpc.crmTriggers.create.useMutation({
    onSuccess: () => { refetch(); setShowCreate(false); toast.success("Trigger aangemaakt"); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.crmTriggers.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Trigger bijgewerkt"); },
  });
  const deleteMut = trpc.crmTriggers.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Trigger verwijderd"); },
  });
  const executeMut = trpc.crmTriggers.execute.useMutation({
    onSuccess: (res) => {
      refetch();
      toast.success(`Trigger uitgevoerd: ${res.results.filter(r => r.status === "success").length}/${res.results.length} acties geslaagd`);
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setNewName(""); setNewDesc(""); setNewEvent("lead_created"); setNewActions([]);
  }

  function addAction(type: string) {
    setNewActions([...newActions, { type, config: {} }]);
  }

  function removeAction(idx: number) {
    setNewActions(newActions.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            CRM Triggers & Automations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Automatiseer acties op basis van events — AI verrijking, scoring, outreach, en meer
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" /> Nieuwe Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-zinc-900 border-zinc-700 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Nieuwe Trigger Aanmaken</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Naam</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Bijv. Auto-enrich nieuwe leads" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">Beschrijving</Label>
                <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Wat doet deze trigger?" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">Trigger Event</Label>
                <Select value={newEvent} onValueChange={setNewEvent}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {EVENT_TYPES.map(et => (
                      <SelectItem key={et.value} value={et.value} className="text-white">
                        {et.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div>
                <Label className="text-zinc-300 mb-2 block">Acties ({newActions.length})</Label>
                {newActions.map((a, i) => {
                  const at = ACTION_TYPES.find(t => t.value === a.type);
                  return (
                    <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-zinc-800 rounded-lg border border-zinc-700">
                      <Brain className="h-4 w-4 text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{at?.label}</p>
                        <p className="text-xs text-zinc-400">{at?.desc}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeAction(i)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {ACTION_TYPES.map(at => (
                    <Button key={at.value} size="sm" variant="outline" onClick={() => addAction(at.value)}
                      className="text-xs text-zinc-300 border-zinc-700 hover:bg-zinc-800 justify-start">
                      <Plus className="h-3 w-3 mr-1" /> {at.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={() => createMut.mutate({ name: newName, description: newDesc, eventType: newEvent as any, actions: newActions as any })}
                disabled={!newName || newActions.length === 0 || createMut.isPending}
                className="w-full bg-green-600 hover:bg-green-700">
                {createMut.isPending ? "Aanmaken..." : "Trigger Aanmaken"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visual Flow Explanation */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-500/30">
              <Eye className="h-4 w-4 text-purple-400" />
              <span className="text-purple-300">Event</span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 rounded-full border border-yellow-500/30">
              <Settings className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-300">Condities</span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
              <Brain className="h-4 w-4 text-green-400" />
              <span className="text-green-300">AI Acties</span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-full border border-blue-500/30">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-blue-300">Resultaat</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triggers Grid */}
      <div className="grid gap-4">
        {triggers?.map(trigger => {
          const et = EVENT_TYPES.find(e => e.value === trigger.eventType);
          const EventIcon = et?.icon || Zap;
          const actions = (trigger.actions || []) as Array<{ type: string; config: Record<string, any> }>;
          return (
            <Card key={trigger.id} className={`bg-zinc-900/50 border-zinc-800 ${!trigger.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Icon + Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg bg-zinc-800 ${et?.color || "text-zinc-400"}`}>
                      <EventIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{trigger.name}</h3>
                        <Badge variant={trigger.isActive ? "default" : "secondary"} className={trigger.isActive ? "bg-green-600/20 text-green-400 border-green-600/30" : ""}>
                          {trigger.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </div>
                      {trigger.description && <p className="text-sm text-zinc-400 mt-1">{trigger.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                          {et?.label || trigger.eventType}
                        </Badge>
                        {actions.map((a, i) => {
                          const at = ACTION_TYPES.find(t => t.value === a.type);
                          return (
                            <Badge key={i} variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                              {at?.label || a.type}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        {trigger.executionCount || 0}x uitgevoerd
                        {trigger.lastExecutedAt && ` · Laatst: ${new Date(trigger.lastExecutedAt).toLocaleDateString("nl-NL")}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={trigger.isActive ?? false} onCheckedChange={(v) => updateMut.mutate({ id: trigger.id, isActive: v })} />
                    <Button size="sm" variant="outline" onClick={() => setShowLogs(showLogs === trigger.id ? null : trigger.id)}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                      <Activity className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => executeMut.mutate({ triggerId: trigger.id })}
                      disabled={executeMut.isPending}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Trigger verwijderen?")) deleteMut.mutate({ id: trigger.id }); }}
                      className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Logs */}
                {showLogs === trigger.id && logs && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <h4 className="text-sm font-medium text-zinc-300 mb-2">Uitvoeringslog</h4>
                    {logs.length === 0 ? (
                      <p className="text-xs text-zinc-500">Nog geen uitvoeringen</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {logs.map(log => (
                          <div key={log.id} className="flex items-center gap-2 text-xs p-2 bg-zinc-800/50 rounded">
                            <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-[10px]">
                              {log.status}
                            </Badge>
                            <span className="text-zinc-400">{new Date(log.executedAt).toLocaleString("nl-NL")}</span>
                            {log.leadId && <span className="text-zinc-500">Lead #{log.leadId}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {(!triggers || triggers.length === 0) && (
          <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
            <CardContent className="p-8 text-center">
              <Zap className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-zinc-400">Geen triggers</h3>
              <p className="text-sm text-zinc-500 mt-1">Maak je eerste trigger aan om CRM acties te automatiseren</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
