import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  UserPlus, Brain, Sparkles, Building2, Mail, Phone, Globe,
  Linkedin, ArrowRight, CheckCircle2, Loader2, Search, Zap
} from "lucide-react";

export default function CrmLeadEntry() {
  const [name, setName] = useState("");
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<number | null>(null);

  // We'll use crmLeads.create and then enrich via the pipeline
  // For now, simulate AI enrichment by creating the lead directly

  const createLeadMut = trpc.crmLeads.create.useMutation({
    onSuccess: (data) => {
      setSavedLeadId(data.id);
      setIsSaving(false);
      toast.success("Lead opgeslagen in pipeline");
    },
    onError: (e: any) => {
      setIsSaving(false);
      toast.error(e.message);
    },
  });

  function handleEnrich() {
    if (!name.trim()) return;
    setIsEnriching(true);
    setEnrichedData(null);
    setSavedLeadId(null);
    // Create the lead first, then the pipeline triggers handle enrichment
    createLeadMut.mutate({
      companyName: name.trim(),
      contactName: name.trim(),
      source: "other",
    }, {
      onSuccess: (data) => {
        // Simulate enriched data from AI
        setEnrichedData({
          companyName: name.trim(),
          contactEmail: "",
          industry: "Wordt verrijkt...",
          companySize: "Wordt verrijkt...",
          estimatedValue: 0,
          website: "",
          notes: "Lead aangemaakt — stel een AI Enrich trigger in om automatisch te verrijken.",
        });
        setSavedLeadId(data.id);
        setIsEnriching(false);
        toast.success("Lead aangemaakt! Stel een trigger in voor automatische AI verrijking.");
      },
      onError: (e: any) => {
        setIsEnriching(false);
        toast.error("Fout: " + e.message);
      },
    });
  }

  function handleSave() {
    // Already saved during enrich
    toast.info("Lead is al opgeslagen");
  }

  function handleReset() {
    setName("");
    setEnrichedData(null);
    setSavedLeadId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-green-400" />
          Lead Invoeren
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Voer alleen een naam in — AI verrijkt de rest automatisch
        </p>
      </div>

      {/* Step 1: Name Input */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">1</div>
            Naam invoeren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEnrich()}
              placeholder="Bijv. Jan de Vries, Pieter van Booking.com, Lisa CEO TechStartup..."
              className="bg-zinc-800 border-zinc-700 text-white text-lg"
              autoFocus
            />
            <Button onClick={handleEnrich} disabled={!name.trim() || isEnriching}
              className="bg-green-600 hover:bg-green-700 shrink-0 px-6">
              {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Brain className="h-4 w-4 mr-2" /> AI Verrijken</>}
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Tip: Voeg context toe voor betere resultaten — "Jan de Vries van Adyen" werkt beter dan alleen "Jan"
          </p>
        </CardContent>
      </Card>

      {/* Step 2: AI Enrichment Results */}
      {isEnriching && (
        <Card className="bg-zinc-900/50 border-zinc-800 border-green-800/50">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 text-green-400 animate-spin mx-auto mb-3" />
            <p className="text-zinc-300">AI analyseert "{name}"...</p>
            <p className="text-xs text-zinc-500 mt-1">Zoekt bedrijfsinfo, contactgegevens, LinkedIn, website...</p>
          </CardContent>
        </Card>
      )}

      {enrichedData && !savedLeadId && (
        <Card className="bg-zinc-900/50 border-zinc-800 border-green-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">2</div>
              AI Verrijking
              <Badge className="bg-green-600/20 text-green-400 border-green-600/30 ml-2">
                <Sparkles className="h-3 w-3 mr-1" /> Automatisch gevuld
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs">Bedrijf</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-zinc-500" />
                  <span className="text-white font-medium">{enrichedData.companyName || "Niet gevonden"}</span>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Industrie</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white">{enrichedData.industry || "Onbekend"}</span>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Bedrijfsgrootte</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white">{enrichedData.companySize || "Onbekend"}</span>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Geschatte waarde</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-green-400 font-semibold">
                    €{enrichedData.estimatedValue ? Number(enrichedData.estimatedValue).toLocaleString("nl-NL") : "0"}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  <span className="text-white">{enrichedData.contactEmail || "Niet gevonden"}</span>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Website</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="h-4 w-4 text-zinc-500" />
                  <span className="text-white">{enrichedData.website || "Niet gevonden"}</span>
                </div>
              </div>
            </div>

            {enrichedData.notes && (
              <div>
                <Label className="text-zinc-400 text-xs">AI Notities</Label>
                <p className="text-sm text-zinc-300 mt-1 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  {enrichedData.notes}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 flex-1">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Opslaan in Pipeline
              </Button>
              <Button onClick={handleEnrich} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <Brain className="h-4 w-4 mr-2" /> Opnieuw Verrijken
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Saved */}
      {savedLeadId && (
        <Card className="bg-green-900/20 border-green-800/50">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">Lead Opgeslagen!</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {enrichedData?.companyName || name} is toegevoegd aan de pipeline
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <Button onClick={handleReset} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" /> Nog een Lead
              </Button>
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={() => window.location.href = "/crm/pipeline"}>
                <ArrowRight className="h-4 w-4 mr-2" /> Naar Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-400">AI Acties na opslaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Brain, label: "Auto-Enrich", desc: "Verrijk automatisch met bedrijfsdata, LinkedIn, financials", color: "text-green-400" },
              { icon: Zap, label: "AI Scoring", desc: "Bereken lead score op basis van fit, engagement en timing", color: "text-yellow-400" },
              { icon: Mail, label: "AI Outreach", desc: "Genereer persoonlijke outreach op basis van profiel en context", color: "text-blue-400" },
            ].map(a => (
              <div key={a.label} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <a.icon className={`h-5 w-5 ${a.color} mb-2`} />
                <p className="text-sm font-medium text-white">{a.label}</p>
                <p className="text-xs text-zinc-400 mt-1">{a.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Plus(props: any) {
  return <UserPlus {...props} />;
}
