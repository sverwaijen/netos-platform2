import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users, Key, ArrowRight, Mail, CheckCircle2, Clock,
  Loader2, RefreshCw, Lock, Unlock, Crown, Star, Filter
} from "lucide-react";

const STAGE_CONFIG = [
  { key: "identified", label: "Geïdentificeerd", color: "bg-zinc-500", description: "Oud-funnel contacten gevonden" },
  { key: "invited", label: "Uitgenodigd", color: "bg-blue-500", description: "Uitnodiging verstuurd voor community" },
  { key: "interested", label: "Geïnteresseerd", color: "bg-yellow-500", description: "Heeft interesse getoond" },
  { key: "key_given", label: "Sleutel Gegeven", color: "bg-green-500", description: "Toegang tot besloten community" },
  { key: "declined", label: "Afgewezen", color: "bg-red-500", description: "Geen interesse" },
];

export default function ReEngagementFunnel() {
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");

  const { data: contacts, refetch } = trpc.reengagement.list.useQuery(
    filterStage !== "all" ? { stage: filterStage } : undefined
  );

  const updateMut = trpc.reengagement.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Status bijgewerkt"); },
    onError: (e: any) => toast.error(e.message),
  });

  const generateInviteMut = trpc.reengagement.generateInvite.useMutation({
    onSuccess: () => { refetch(); toast.success("AI uitnodiging gegenereerd"); },
    onError: (e: any) => toast.error(e.message),
  });

  const stageCounts = STAGE_CONFIG.map(s => ({
    ...s,
    count: contacts?.filter((c: any) => c.stage === s.key).length || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="h-6 w-6 text-amber-400" />
            Re-Engagement Funnel
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Transitie naar besloten community — geef oud-funnel contacten een sleutel tot ons domein
          </p>
        </div>
      </div>

      {/* Visual Funnel */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {stageCounts.map((stage, i) => (
          <button key={stage.key} onClick={() => setFilterStage(filterStage === stage.key ? "all" : stage.key)}
            className={`p-3 rounded-lg border text-center transition-all ${
              filterStage === stage.key ? "border-white bg-zinc-800" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50"
            }`}>
            <div className={`w-3 h-3 rounded-full ${stage.color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-white">{stage.count}</p>
            <p className="text-[10px] text-zinc-400">{stage.label}</p>
          </button>
        ))}
      </div>

      {/* Concept uitleg */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-zinc-900 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-white">Besloten Community Transitie</h3>
              <p className="text-xs text-zinc-400 mt-1">
                We sluiten de deuren van onze community maar willen waardevolle contacten uit eerdere funnels een
                persoonlijke sleutel geven. Dit is een exclusieve uitnodiging — niet iedereen krijgt toegang.
                Contacten doorlopen: Identificatie → Persoonlijke uitnodiging → Interesse peiling → Sleutel uitreiking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op naam, bedrijf of email..."
            className="pl-9 bg-zinc-900/50 border-zinc-800 text-white" />
        </div>
        <Button variant="outline" onClick={() => setFilterStage("all")}
          className="border-zinc-700 text-zinc-300">
          Toon alles ({contacts?.length || 0})
        </Button>
      </div>

      {/* Contacts List */}
      <div className="space-y-2">
        {contacts?.map((contact: any) => (
          <Card key={contact.id} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-white truncate">{contact.contactName || contact.companyName}</h3>
                    <Badge className={`text-[10px] ${
                      contact.stage === "key_given" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                      contact.stage === "invited" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                      contact.stage === "interested" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                      contact.stage === "declined" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                      "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                    }`}>
                      {STAGE_CONFIG.find(s => s.key === contact.stage)?.label || contact.stage}
                    </Badge>
                    {contact.originalFunnel && (
                      <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                        Funnel: {contact.originalFunnel}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-500">
                    {contact.companyName && <span>{contact.companyName}</span>}
                    {contact.contactEmail && <span>{contact.contactEmail}</span>}
                    {contact.lastInteractionAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Laatste contact: {new Date(contact.lastInteractionAt).toLocaleDateString("nl-NL")}
                      </span>
                    )}
                  </div>
                  {contact.personalNote && (
                    <p className="text-xs text-zinc-400 mt-1 italic">"{contact.personalNote}"</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {contact.stage === "identified" && (
                    <>
                      <Button size="sm" onClick={() => generateInviteMut.mutate({ id: contact.id })}
                        disabled={generateInviteMut.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-xs">
                        {generateInviteMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                        AI Uitnodiging
                      </Button>
                      <Button size="sm" onClick={() => updateMut.mutate({ id: contact.id, stage: "invited" })}
                        disabled={updateMut.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-xs">
                        <Mail className="h-3 w-3 mr-1" /> Uitnodigen
                      </Button>
                    </>
                  )}
                  {contact.stage === "invited" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: contact.id, stage: "opened" })}
                        className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs">
                        <Star className="h-3 w-3 mr-1" /> Geopend
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: contact.id, stage: "declined" })}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                        Afgewezen
                      </Button>
                    </>
                  )}
                  {contact.stage === "opened" && (
                    <Button size="sm" onClick={() => updateMut.mutate({ id: contact.id, stage: "applied" })}
                      disabled={updateMut.isPending}
                      className="bg-yellow-600 hover:bg-yellow-700 text-xs">
                      <ArrowRight className="h-3 w-3 mr-1" /> Aanmelding
                    </Button>
                  )}
                  {contact.stage === "applied" && (
                    <>
                      <Button size="sm" onClick={() => updateMut.mutate({ id: contact.id, stage: "accepted" })}
                        disabled={updateMut.isPending}
                        className="bg-green-600 hover:bg-green-700 text-xs">
                        <Key className="h-3 w-3 mr-1" /> Accepteren
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: contact.id, stage: "declined" })}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                        Afwijzen
                      </Button>
                    </>
                  )}
                  {contact.stage === "accepted" && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Unlock className="h-3 w-3 mr-1" /> Toegang verleend
                    </Badge>
                  )}
                  {contact.stage === "declined" && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <Lock className="h-3 w-3 mr-1" /> Afgewezen
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!contacts || contacts.length === 0) && (
          <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
            <CardContent className="p-8 text-center">
              <Key className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-zinc-400">Geen contacten gevonden</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Importeer oud-funnel contacten of voeg ze handmatig toe
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
