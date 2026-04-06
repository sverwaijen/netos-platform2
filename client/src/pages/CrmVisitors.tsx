import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Eye, Brain, Building2, Globe, MapPin, Clock, ArrowRight,
  Loader2, UserPlus, Mail, TrendingUp, AlertCircle, CheckCircle2, Search
} from "lucide-react";

const INTENT_COLORS: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export default function CrmVisitors() {
  const [search, setSearch] = useState("");
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const { data: visitors, refetch } = trpc.crmVisitors.list.useQuery({
    limit: 50,
  });

  const analyzeMut = trpc.crmVisitors.analyze.useMutation({
    onSuccess: (data: any) => {
      setAnalysisResult(data);
      setAnalyzingId(null);
      toast.success("AI analyse compleet");
    },
    onError: (e: any) => {
      setAnalyzingId(null);
      toast.error(e.message);
    },
  });

  const convertMut = trpc.crmVisitors.generateOutreach.useMutation({
    onSuccess: () => {
      refetch();
      setConvertingId(null);
      toast.success("Bezoeker omgezet naar lead in pipeline");
    },
    onError: (e: any) => {
      setConvertingId(null);
      toast.error(e.message);
    },
  });

  function handleAnalyze(visitor: any) {
    setAnalyzingId(visitor.id);
    setAnalysisResult(null);
    analyzeMut.mutate({ id: visitor.id });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="h-6 w-6 text-purple-400" />
            Website Bezoekers
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            LeadInfo-style detectie — wie bezoekt onze site? AI analyseert en matcht met pipeline
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bezoekers vandaag", value: visitors?.filter(v => new Date(v.firstVisitAt).toDateString() === new Date().toDateString()).length || 0, color: "text-purple-400" },
          { label: "Geïdentificeerd", value: visitors?.filter(v => v.isIdentified).length || 0, color: "text-red-400" },
          { label: "Met bedrijf", value: visitors?.filter(v => v.companyName).length || 0, color: "text-green-400" },
          { label: "Matched met lead", value: visitors?.filter(v => v.matchedLeadId).length || 0, color: "text-blue-400" },
        ].map(s => (
          <Card key={s.label} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-400">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op bedrijf, IP of pagina..."
          className="pl-9 bg-zinc-900/50 border-zinc-800 text-white" />
      </div>

      {/* Visitors List */}
      <div className="space-y-3">
        {visitors?.map(visitor => (
          <Card key={visitor.id} className={`bg-zinc-900/50 border-zinc-800 ${visitor.status === "outreach_sent" ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Company info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">
                      {visitor.companyName || visitor.ipAddress || "Onbekend"}
                    </h3>
                    <Badge className={visitor.isIdentified ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}>
                      {visitor.isIdentified ? "Geïdentificeerd" : "Anoniem"}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                      {visitor.status}
                    </Badge>
                    {visitor.matchedLeadId && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Matched met lead #{visitor.matchedLeadId}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                    {visitor.companyIndustry && (
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {visitor.companyIndustry}</span>
                    )}
                    {visitor.city && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {visitor.city}{visitor.country ? `, ${visitor.country}` : ""}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(visitor.firstVisitAt).toLocaleString("nl-NL")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {visitor.totalPageViews || 1} pagina's
                    </span>
                    {visitor.totalVisits && visitor.totalVisits > 1 && (
                      <span>{visitor.totalVisits} bezoeken</span>
                    )}
                  </div>

                  {/* Pages visited */}
                  {visitor.pagesViewed && (visitor.pagesViewed as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(visitor.pagesViewed as string[]).slice(0, 5).map((page: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                          {page}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleAnalyze(visitor)}
                    disabled={analyzingId === visitor.id}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    {analyzingId === visitor.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3 mr-1" />}
                    AI Analyse
                  </Button>
                  {!visitor.matchedLeadId && (
                    <Button size="sm" onClick={() => { setConvertingId(visitor.id); convertMut.mutate({ id: visitor.id }); }}
                      disabled={convertingId === visitor.id}
                      className="bg-green-600 hover:bg-green-700">
                      {convertingId === visitor.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3 mr-1" />}
                      → Lead
                    </Button>
                  )}
                </div>
              </div>

              {/* AI Analysis Result */}
              {analysisResult && analyzingId === null && analyzeMut.variables?.id === visitor.id && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-green-400" /> AI Analyse Resultaat
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-xs text-zinc-400">Bedrijf</p>
                      <p className="text-white font-medium">{analysisResult.companyName}</p>
                    </div>
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-xs text-zinc-400">Industrie</p>
                      <p className="text-white">{analysisResult.industry}</p>
                    </div>
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-xs text-zinc-400">Omvang</p>
                      <p className="text-white">{analysisResult.companySize}</p>
                    </div>
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-xs text-zinc-400">Omzet</p>
                      <p className="text-white">{analysisResult.revenue}</p>
                    </div>
                    <div className="p-3 bg-zinc-800/50 rounded-lg col-span-full">
                      <p className="text-xs text-zinc-400">Aanbevolen actie</p>
                      <p className="text-green-400 font-medium">{analysisResult.recommendedAction}</p>
                    </div>
                    {analysisResult.interestAreas?.length > 0 && (
                      <div className="p-3 bg-zinc-800/50 rounded-lg col-span-full">
                        <p className="text-xs text-zinc-400 mb-1">Interesse gebieden</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.interestAreas.map((area: string, i: number) => (
                            <Badge key={i} className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">{area}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!visitors || visitors.length === 0) && (
          <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
            <CardContent className="p-8 text-center">
              <Eye className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-zinc-400">Geen bezoekers gedetecteerd</h3>
              <p className="text-sm text-zinc-500 mt-1">Website bezoekers verschijnen hier automatisch via de tracking pixel</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
