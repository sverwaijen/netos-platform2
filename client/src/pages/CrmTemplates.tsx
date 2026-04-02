import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Mail, Sparkles, Trash2, Edit3, Copy, FileText } from "lucide-react";

export default function CrmTemplates() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "", category: "" });

  const { data: templates = [], refetch } = trpc.crmTemplates.list.useQuery();
  const createTemplate = trpc.crmTemplates.create.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); resetForm(); toast.success("Template created"); } });
  const updateTemplate = trpc.crmTemplates.update.useMutation({ onSuccess: () => { refetch(); setEditingId(null); resetForm(); toast.success("Template updated"); } });
  const deleteTemplate = trpc.crmTemplates.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Template deleted"); } });
  const aiGenerate = trpc.crmTemplates.aiGenerate.useMutation();

  const resetForm = () => setForm({ name: "", subject: "", body: "", category: "" });

  const startEdit = (t: any) => {
    setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category || "" });
    setEditingId(t.id);
    setShowCreate(true);
  };

  const handleAiGenerate = async () => {
    const result = await aiGenerate.mutateAsync({ tone: "professional", context: form.category || "coworking introduction" });
    setForm(p => ({ ...p, subject: result.subject, body: result.body }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Email Templates</h1>
          <p className="text-sm text-[#111]/50 mt-1 tracking-wide uppercase font-light">Reusable templates for outreach campaigns</p>
        </div>
        <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) { setEditingId(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#627653] hover:bg-[#3a4a34] text-white">
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-[#f6f5f2] border-[#e8e6e1]">
            <DialogHeader>
              <DialogTitle className="text-[#111]">{editingId ? "Edit Template" : "Create Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs uppercase tracking-wider text-[#111]/50">Template Name *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-white border-[#e8e6e1]" placeholder="e.g. Welcome Introduction" />
                </div>
                <div className="w-32">
                  <Label className="text-xs uppercase tracking-wider text-[#111]/50">Category</Label>
                  <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="mt-1 bg-white border-[#e8e6e1]" placeholder="e.g. intro" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-[#111]/50">Subject *</Label>
                  <Button size="sm" variant="ghost" onClick={handleAiGenerate} disabled={aiGenerate.isPending} className="text-[#627653] h-6 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" /> {aiGenerate.isPending ? "Generating..." : "AI Generate"}
                  </Button>
                </div>
                <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="mt-1 bg-white border-[#e8e6e1]" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#111]/50">Body *</Label>
                <Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} className="mt-1 bg-white border-[#e8e6e1] font-mono text-xs" rows={10} />
              </div>
              <Button
                className="w-full bg-[#627653] hover:bg-[#3a4a34] text-white"
                onClick={() => editingId ? updateTemplate.mutate({ id: editingId, ...form }) : createTemplate.mutate(form)}
                disabled={!form.name || !form.subject || !form.body}
              >
                {editingId ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 bg-white border-[#e8e6e1] text-center">
          <FileText className="w-10 h-10 text-[#111]/15 mx-auto mb-3" />
          <p className="text-sm text-[#111]/40">No email templates yet</p>
          <p className="text-xs text-[#111]/30 mt-1">Create templates for your outreach campaigns</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t: any) => (
            <Card key={t.id} className="p-4 bg-white border-[#e8e6e1] hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#111]">{t.name}</h3>
                  {t.category && (
                    <Badge variant="secondary" className="text-[10px] bg-[#f6f5f2] text-[#111]/40 mt-1">{t.category}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(t)} className="h-7 w-7 p-0 text-[#111]/30 hover:text-[#627653]">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(t.body); toast.success("Copied to clipboard"); }} className="h-7 w-7 p-0 text-[#111]/30 hover:text-[#627653]">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteTemplate.mutate({ id: t.id }); }} className="h-7 w-7 p-0 text-[#111]/30 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="bg-[#f6f5f2] rounded-lg p-3">
                <p className="text-xs font-medium text-[#111]/70 mb-1">{t.subject}</p>
                <p className="text-xs text-[#111]/40 line-clamp-3">{t.body.replace(/<[^>]*>/g, "")}</p>
              </div>
              {t.isAiGenerated && (
                <div className="flex items-center gap-1 mt-2">
                  <Sparkles className="w-3 h-3 text-[#b8a472]" />
                  <span className="text-[10px] text-[#b8a472]">AI generated</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
