import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { RefreshCw, Eye, AlertCircle, CheckCircle2 } from "lucide-react";

interface BrandingPreviewPanelProps {
  companyId: number;
  companyName: string;
}

export function BrandingPreviewPanel({ companyId, companyName }: BrandingPreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Get live preview data
  const { data: preview, refetch: refetchPreview } = (trpc.signing as any).getLivePreview.useQuery(
    { companyId },
    { enabled: !!companyId }
  );

  // Trigger scrape mutation
  const triggerScrape = (trpc.signing as any).triggerBrandScrape.useMutation({
    onSuccess: () => {
      toast.success("Branding gescraped en bijgewerkt!");
      setIsLoading(false);
      refetchPreview();
    },
    onError: (error: any) => {
      toast.error(`Scrape mislukt: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleScrape = async () => {
    setIsLoading(true);
    triggerScrape.mutate({ companyId });
  };

  if (!preview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Branding Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Laden...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Branding Live Preview: {companyName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scrape Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleScrape}
            disabled={isLoading}
            variant="default"
            className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Haal branding op
          </Button>
          {preview.scraped && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {preview.scraped.status === "completed" && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Gescraped op {new Date(preview.scraped.lastScrapedAt).toLocaleString("nl-NL")}</span>
                </>
              )}
              {preview.scraped.status === "scraping" && (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-500 animate-spin" />
                  <span>Aan het scrapen...</span>
                </>
              )}
              {preview.scraped.status === "failed" && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>Scrape mislukt</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Branding Preview */}
        <div className="grid grid-cols-2 gap-4">
          {/* Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Kleuren</h3>
            <div className="space-y-1">
              {preview.branding && (
                <>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: preview.branding.primaryColor }}
                    />
                    <span className="text-xs">Primair: {preview.branding.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: preview.branding.secondaryColor }}
                    />
                    <span className="text-xs">Secundair: {preview.branding.secondaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: preview.branding.accentColor }}
                    />
                    <span className="text-xs">Accent: {preview.branding.accentColor}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Logo</h3>
            {preview.branding?.logoUrl && (
              <img
                src={preview.branding.logoUrl}
                alt="Logo"
                className="h-12 object-contain bg-gray-50 p-2 rounded"
              />
            )}
          </div>
        </div>

        {/* Typography */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Typografie</h3>
          <p className="text-xs text-muted-foreground">
            Font: {preview.branding?.fontFamily || "Niet ingesteld"}
          </p>
        </div>

        {/* Employee Photos */}
        {preview.photos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Foto's ({preview.photos.length})</h3>
            <div className="grid grid-cols-4 gap-2">
              {preview.photos.map((photo: any) => (
                <div key={photo.id} className="aspect-square rounded overflow-hidden bg-gray-100">
                  <img src={photo.url} alt={photo.employeeName} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scraped Data */}
        {preview.scraped && preview.scraped.scrapedColors && preview.scraped.scrapedColors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Gescrapte Kleuren</h3>
            <div className="flex gap-1">
              {preview.scraped.scrapedColors.map((color: string, idx: number) => (
                <div
                  key={idx}
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scraped Fonts */}
        {preview.scraped && preview.scraped.scrapedFonts && preview.scraped.scrapedFonts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Gescrapte Fonts</h3>
            <div className="space-y-1">
              {preview.scraped.scrapedFonts.map((font: string, idx: number) => (
                <p key={idx} className="text-xs text-muted-foreground">{font}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
