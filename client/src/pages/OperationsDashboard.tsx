import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Ticket, Calendar, Users, AlertTriangle, MessageSquare, Plus,
  Clock, CheckCircle, XCircle, Bot, TrendingUp, Search,
  ChevronRight, Star, Sparkles, Send,
} from "lucide-react";

const priorityColors: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-400",
  normal: "bg-blue-500/10 text-blue-400",
  high: "bg-amber-500/10 text-amber-400",
  urgent: "bg-red-500/10 text-red-400",
};

const statusColors: Record<string, string> = {
  new: "bg-purple-500/10 text-purple-400",
  open: "bg-blue-500/10 text-blue-400",
  pending: "bg-amber-500/10 text-amber-400",
  on_hold: "bg-slate-500/10 text-slate-400",
  solved: "bg-green-500/10 text-green-400",
  closed: "bg-muted text-muted-foreground",
};

export default function OperationsDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tickets");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);

  const ticketStats = trpc.tickets.stats.useQuery(undefined, { enabled: user?.role === "administrator" });
  const presenceStats = trpc.presence.stats.useQuery();
  const whoIsIn = trpc.presence.whoIsIn.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Operations</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Tickets, agenda, aanwezigheid & meldingen</p>
        </div>
        <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Nieuw ticket</Button>
          </DialogTrigger>
          <CreateTicketDialog onClose={() => setShowCreateTicket(false)} />
        </Dialog>
      </div>

      {/* Quick Stats */}
      {user?.role === "administrator" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          <StatCard icon={Ticket} label="Open tickets" value={ticketStats.data?.open || 0} color="text-blue-500" bg="bg-blue-500/10" />
          <StatCard icon={Clock} label="In behandeling" value={ticketStats.data?.pending || 0} color="text-amber-500" bg="bg-amber-500/10" />
          <StatCard icon={CheckCircle} label="Opgelost" value={ticketStats.data?.solved || 0} color="text-green-500" bg="bg-green-500/10" />
          <StatCard icon={Bot} label="AI opgelost" value={ticketStats.data?.aiResolved || 0} color="text-purple-500" bg="bg-purple-500/10" />
          <StatCard icon={Users} label="Aanwezig" value={presenceStats.data?.currentlyIn || 0} color="text-emerald-500" bg="bg-emerald-500/10" />
          <StatCard icon={Star} label="Tevredenheid" value={`${ticketStats.data?.satisfaction || 0}/5`} color="text-yellow-500" bg="bg-yellow-500/10" />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="tickets" className="flex-1 sm:flex-none text-xs sm:text-sm"><Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Tickets</TabsTrigger>
          <TabsTrigger value="agenda" className="flex-1 sm:flex-none text-xs sm:text-sm"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Agenda</TabsTrigger>
          <TabsTrigger value="presence" className="flex-1 sm:flex-none text-xs sm:text-sm"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Wie is er?</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          {selectedTicket ? (
            <TicketDetail ticketId={selectedTicket} onBack={() => setSelectedTicket(null)} />
          ) : (
            <TicketList
              filter={ticketFilter}
              onFilterChange={setTicketFilter}
              search={searchQuery}
              onSearchChange={setSearchQuery}
              onSelect={setSelectedTicket}
            />
          )}
        </TabsContent>

        <TabsContent value="agenda">
          <AgendaTab />
        </TabsContent>

        <TabsContent value="presence">
          <PresenceTab data={whoIsIn.data} stats={presenceStats.data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: number | string; color: string; bg: string }) {
  return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
          <div>
            <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            <p className="text-lg font-semibold leading-tight">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTicketDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ subject: "", description: "", category: "general" as const, priority: "normal" as const });
  const utils = trpc.useUtils();
  const createTicket = trpc.tickets.create.useMutation({
    onSuccess: (data) => {
      utils.tickets.list.invalidate();
      utils.tickets.stats.invalidate();
      if (data.aiAutoResolved) {
        toast.success(`Ticket ${data.ticketNumber} aangemaakt en automatisch opgelost door AI`);
      } else {
        toast.success(`Ticket ${data.ticketNumber} aangemaakt`);
      }
      onClose();
    },
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nieuw support ticket</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Input placeholder="Onderwerp" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
        <Textarea placeholder="Beschrijf je probleem..." rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as any }))}>
            <SelectTrigger><SelectValue placeholder="Categorie" /></SelectTrigger>
            <SelectContent>
              {["general", "billing", "access", "booking", "parking", "maintenance", "wifi", "catering", "equipment", "noise", "cleaning", "other"].map(c => (
                <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as any }))}>
            <SelectTrigger><SelectValue placeholder="Prioriteit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Laag</SelectItem>
              <SelectItem value="normal">Normaal</SelectItem>
              <SelectItem value="high">Hoog</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          AI analyseert je ticket automatisch en kan direct antwoord geven
        </div>
        <Button className="w-full" onClick={() => createTicket.mutate(form)} disabled={createTicket.isPending || !form.subject}>
          {createTicket.isPending ? "Wordt aangemaakt..." : "Ticket aanmaken"}
        </Button>
      </div>
    </DialogContent>
  );
}

function TicketList({ filter, onFilterChange, search, onSearchChange, onSelect }: {
  filter: string; onFilterChange: (f: string) => void;
  search: string; onSearchChange: (s: string) => void;
  onSelect: (id: number) => void;
}) {
  const tickets = trpc.tickets.list.useQuery({ status: filter === "all" ? undefined : filter, search: search || undefined });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Zoek tickets..." value={search} onChange={e => onSearchChange(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle tickets</SelectItem>
            <SelectItem value="new">Nieuw</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">In behandeling</SelectItem>
            <SelectItem value="solved">Opgelost</SelectItem>
            <SelectItem value="closed">Gesloten</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tickets.data?.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-12 text-center">
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Geen tickets gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.data?.map((ticket: any) => (
            <Card key={ticket.id} className="bg-card/50 border-border/30 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => onSelect(ticket.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">{ticket.ticketNumber}</span>
                        {ticket.aiAutoResolved && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-400"><Bot className="w-3 h-3 mr-0.5" />AI</Badge>}
                      </div>
                      <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge className={`text-[10px] ${statusColors[ticket.status] || ""}`}>{ticket.status}</Badge>
                    <Badge className={`text-[10px] ${priorityColors[ticket.priority || "normal"]}`}>{ticket.priority}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketDetail({ ticketId, onBack }: { ticketId: number; onBack: () => void }) {
  const { user } = useAuth();
  const ticket = trpc.tickets.getById.useQuery({ id: ticketId });
  const messages = trpc.tickets.getMessages.useQuery({ ticketId });
  const [reply, setReply] = useState("");
  const utils = trpc.useUtils();

  const addMessage = trpc.tickets.addMessage.useMutation({
    onSuccess: () => { messages.refetch(); setReply(""); toast.success("Bericht verzonden"); },
  });

  const updateTicket = trpc.tickets.update.useMutation({
    onSuccess: () => { ticket.refetch(); utils.tickets.list.invalidate(); toast.success("Ticket bijgewerkt"); },
  });

  const aiSuggest = trpc.tickets.aiSuggest.useMutation({
    onSuccess: (data) => { setReply(data.suggestion); toast.success("AI suggestie geladen"); },
  });

  if (!ticket.data) return null;
  const t = ticket.data;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>← Terug naar tickets</Button>

      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-mono">{t.ticketNumber}</span>
                <Badge className={`text-[10px] ${statusColors[t.status]}`}>{t.status}</Badge>
                <Badge className={`text-[10px] ${priorityColors[t.priority || "normal"]}`}>{t.priority}</Badge>
                {t.aiAutoResolved && <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400"><Bot className="w-3 h-3 mr-0.5" />AI opgelost</Badge>}
              </div>
              <h2 className="text-lg font-medium">{t.subject}</h2>
              {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
            </div>
            {user?.role === "administrator" && (
              <div className="flex gap-2">
                <Select value={t.status} onValueChange={v => updateTicket.mutate({ id: ticketId, status: v as any })}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["new", "open", "pending", "on_hold", "solved", "closed"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {t.aiSuggestion && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">AI Analyse</span>
              </div>
              <p className="text-sm text-muted-foreground">{t.aiSuggestion}</p>
              {t.aiSentiment && <Badge className="mt-2 text-[10px]" variant="outline">{t.aiSentiment}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader><CardTitle className="text-base font-medium">Berichten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {messages.data?.map((msg: any) => (
            <div key={msg.id} className={`p-3 rounded-lg ${msg.senderType === "ai" ? "bg-purple-500/5 border border-purple-500/20" : msg.senderType === "agent" ? "bg-blue-500/5 border border-blue-500/20" : "bg-muted/30 border border-border/20"}`}>
              <div className="flex items-center gap-2 mb-1">
                {msg.senderType === "ai" ? <Bot className="w-3.5 h-3.5 text-purple-400" /> : <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-xs font-medium">{msg.senderType === "ai" ? "AI Assistant" : msg.senderType === "agent" ? "Agent" : "Gebruiker"}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString("nl-NL")}</span>
                {msg.isInternal && <Badge variant="outline" className="text-[10px]">Intern</Badge>}
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
            </div>
          ))}

          {/* Reply */}
          <div className="pt-3 border-t border-border/20">
            <Textarea placeholder="Typ je antwoord..." rows={3} value={reply} onChange={e => setReply(e.target.value)} />
            <div className="flex items-center justify-between mt-2">
              {user?.role === "administrator" && (
                <Button variant="outline" size="sm" onClick={() => aiSuggest.mutate({ ticketId })} disabled={aiSuggest.isPending}>
                  <Sparkles className="w-3.5 h-3.5 mr-1" />{aiSuggest.isPending ? "Denkt na..." : "AI suggestie"}
                </Button>
              )}
              <Button size="sm" onClick={() => addMessage.mutate({ ticketId, body: reply })} disabled={!reply || addMessage.isPending}>
                <Send className="w-3.5 h-3.5 mr-1" />Verstuur
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AgendaTab() {
  const [showCreate, setShowCreate] = useState(false);
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }, []);
  const weekEnd = useMemo(() => today + 7 * 86400000, [today]);
  const agenda = trpc.opsAgenda.list.useQuery({ startDate: today, endDate: weekEnd });
  const [form, setForm] = useState({ title: "", description: "", type: "event" as const, startTime: Date.now(), locationId: 1, priority: "normal" as const });
  const createItem = trpc.opsAgenda.create.useMutation({
    onSuccess: () => { agenda.refetch(); setShowCreate(false); toast.success("Agenda-item aangemaakt"); },
  });

  const typeIcons: Record<string, string> = {
    event: "🎉", maintenance: "🔧", cleaning: "🧹", delivery: "📦",
    meeting: "📋", inspection: "🔍", other: "📌",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Agenda deze week</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Item toevoegen</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nieuw agenda-item</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Titel" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Beschrijving" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["event", "maintenance", "cleaning", "delivery", "meeting", "inspection", "other"].map(t => (
                    <SelectItem key={t} value={t}>{typeIcons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="datetime-local" onChange={e => setForm(p => ({ ...p, startTime: new Date(e.target.value).getTime() }))} />
              <Button className="w-full" onClick={() => createItem.mutate(form)}>Aanmaken</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {agenda.data?.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">Geen items deze week</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {agenda.data?.map((item: any) => (
            <Card key={item.id} className="bg-card/50 border-border/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{typeIcons[item.type || "other"]}</span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Number(item.startTime)).toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <Badge variant={item.status === "completed" ? "default" : item.status === "in_progress" ? "outline" : "secondary"}>
                  {item.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PresenceTab({ data, stats }: { data: any[] | undefined; stats: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-semibold text-emerald-500">{stats?.currentlyIn || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Nu aanwezig</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-semibold">{stats?.totalToday || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Vandaag totaal</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-semibold">{stats?.avgDailyVisitors || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Gem. per dag</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/30">
        <CardHeader><CardTitle className="text-base font-medium">Wie is er vandaag?</CardTitle></CardHeader>
        <CardContent>
          {!data?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nog niemand ingecheckt vandaag</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {data.map((person: any) => (
                <div key={person.userId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {person.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{person.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {person.lastEntryAt ? new Date(person.lastEntryAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : ""}
                      {person.zone && ` · ${person.zone}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
