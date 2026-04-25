import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Receipt, Plus, CreditCard, CheckCircle2, Download,
  FileText, Send, Ban, Loader2,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400",
  cancelled: "bg-gray-500/20 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Concept",
  sent: "Verzonden",
  paid: "Betaald",
  overdue: "Achterstallig",
  cancelled: "Geannuleerd",
};

function downloadInvoicePdf(invoiceId: number, invoiceNumber: string) {
  const link = document.createElement("a");
  link.href = `/api/invoice/${invoiceId}/pdf`;
  link.download = `factuur-${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function downloadBatchPdf(invoiceIds: number[]) {
  try {
    const response = await fetch("/api/invoices/batch-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIds }),
    });
    if (!response.ok) throw new Error("Batch PDF generation failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `facturen-batch-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Batch PDF generatie mislukt");
  }
}

export default function RozInvoicesTab() {
  const { data: invoices, isLoading } = trpc.rozInvoices.list.useQuery({});
  const { data: contracts } = trpc.rozContracts.list.useQuery({ status: "active" });
  const utils = trpc.useUtils();

  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);

  const generateMut = trpc.rozInvoices.generate.useMutation({
    onSuccess: (data) => {
      utils.rozInvoices.list.invalidate();
      setShowGenerate(false);
      toast.success(`Factuur ${data.invoiceNumber} aangemaakt: ${data.totalCredits.toFixed(0)} credits`);
    },
    onError: (e) => toast.error(e.message),
  });

  const payMut = trpc.rozInvoices.pay.useMutation({
    onSuccess: () => {
      utils.rozInvoices.list.invalidate();
      utils.wallets.mine.invalidate();
      toast.success("Factuur betaald via credits");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.rozInvoices.update.useMutation({
    onSuccess: () => {
      utils.rozInvoices.list.invalidate();
      toast.success("Factuur bijgewerkt");
    },
  });

  function handleGenerate() {
    if (!selectedContractId) return;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
    generateMut.mutate({ contractId: selectedContractId, periodStart, periodEnd });
  }

  function handleDownloadPdf(invoiceId: number, invoiceNumber: string) {
    setDownloadingId(invoiceId);
    downloadInvoicePdf(invoiceId, invoiceNumber);
    setTimeout(() => setDownloadingId(null), 2000);
  }

  async function handleBatchDownload() {
    if (!invoices?.length) return;
    setBatchDownloading(true);
    const ids = invoices.map((i: any) => i.id);
    await downloadBatchPdf(ids);
    setBatchDownloading(false);
  }

  // Summary stats
  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter((i: any) => i.status === "paid").length || 0;
  const overdueInvoices = invoices?.filter((i: any) => i.status === "overdue").length || 0;
  const totalRevenue = invoices?.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + parseFloat(i.totalCredits), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            ROZ Facturatie
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Maandelijkse credit-facturatie voor actieve ROZ-contracten.
          </p>
        </div>
        <div className="flex gap-2">
          {totalInvoices > 1 && (
            <Button
              variant="outline"
              onClick={handleBatchDownload}
              disabled={batchDownloading}
              className="text-amber-500 border-amber-500/30"
            >
              {batchDownloading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
              Alle PDF's
            </Button>
          )}
          <Button
            onClick={() => setShowGenerate(true)}
            disabled={!contracts?.length}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Factuur genereren
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/[0.03] border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{totalInvoices}</p>
            <p className="text-[10px] text-muted-foreground">Totaal facturen</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{paidInvoices}</p>
            <p className="text-[10px] text-muted-foreground">Betaald</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{overdueInvoices}</p>
            <p className="text-[10px] text-muted-foreground">Achterstallig</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{totalRevenue.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Credits ontvangen</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>
      ) : !invoices?.length ? (
        <Card className="bg-white/[0.02] border-border/30">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nog geen facturen</p>
            <p className="text-[11px] mt-1">Genereer facturen voor actieve ROZ-contracten.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv: any) => (
            <Card key={inv.id} className="bg-white/[0.02] border-border/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium font-mono">{inv.invoiceNumber}</p>
                      <Badge className={`text-[9px] ${STATUS_COLORS[inv.status] || ""}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Huur: {parseFloat(inv.rentCredits).toFixed(0)}c
                      </span>
                      {parseFloat(inv.serviceChargeCredits || "0") > 0 && (
                        <span className="flex items-center gap-1">
                          Service: +{parseFloat(inv.serviceChargeCredits).toFixed(0)}c
                        </span>
                      )}
                      <span className="font-medium text-foreground">
                        Totaal: {parseFloat(inv.totalCredits).toFixed(0)} credits
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Periode: {new Date(inv.periodStart).toLocaleDateString("nl-NL")} — {new Date(inv.periodEnd).toLocaleDateString("nl-NL")}
                      {inv.dueDate && ` · Vervaldatum: ${new Date(inv.dueDate).toLocaleDateString("nl-NL")}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {/* PDF Download button — always visible */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-500 border-amber-500/30"
                      onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                      disabled={downloadingId === inv.id}
                    >
                      {downloadingId === inv.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <><Download className="w-3 h-3 mr-1" /> PDF</>
                      )}
                    </Button>
                    {inv.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-400 border-blue-400/30"
                        onClick={() => updateMut.mutate({ id: inv.id, status: "sent" })}
                      >
                        <Send className="w-3 h-3 mr-1" /> Verzenden
                      </Button>
                    )}
                    {(inv.status === "sent" || inv.status === "overdue") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-400 border-green-400/30"
                        onClick={() => payMut.mutate({ invoiceId: inv.id })}
                        disabled={payMut.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Betalen
                      </Button>
                    )}
                    {inv.status === "draft" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => updateMut.mutate({ id: inv.id, status: "cancelled" })}
                      >
                        <Ban className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Invoice Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" /> Factuur genereren
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Selecteer actief contract</label>
              <Select
                value={selectedContractId?.toString() || ""}
                onValueChange={(v) => setSelectedContractId(parseInt(v))}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Kies een contract..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.contractNumber} — {parseFloat(c.monthlyRentCredits).toFixed(0)}c/mnd
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p>De factuur wordt gegenereerd voor de huidige maand. Huur en servicekosten worden automatisch overgenomen uit het contract.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)}>Annuleren</Button>
            <Button
              disabled={!selectedContractId || generateMut.isPending}
              onClick={handleGenerate}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {generateMut.isPending ? "Genereren..." : "Genereer factuur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
