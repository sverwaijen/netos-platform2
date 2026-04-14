import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { QrCode, Car, Clock, CheckCircle2, XCircle, MapPin } from "lucide-react";

/**
 * Public visitor landing page.
 * Accessed via /parking/visitor/:qrToken
 * Shows QR code, validity status, and parking instructions.
 */
export default function ParkingVisitor() {
  const params = useParams<{ qrToken: string }>();
  const qrToken = params?.qrToken;
  const { data: permit, isLoading } = trpc.parkingVisitorPermits.validate.useQuery(
    { qrToken: qrToken || "" },
    { enabled: !!qrToken }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-white/30 text-sm">Laden...</div>
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
          <h1 className="text-white text-xl font-light mb-2">Ongeldige parkeercode</h1>
          <p className="text-white/30 text-sm">Deze link is niet geldig of is verlopen.</p>
        </div>
      </div>
    );
  }

  const validFrom = new Date(Number(permit.validFrom));
  const validUntil = new Date(Number(permit.validUntil));
  const isValid = permit.isValid;

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-8">
      <div className="max-w-sm mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
            isValid ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}>
            {isValid ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : (
              <XCircle className="w-10 h-10 text-red-500" />
            )}
          </div>
          <h1 className="text-white text-xl font-light">
            {isValid ? "Welkom" : "Pas verlopen"}
          </h1>
          <p className="text-white/30 text-sm mt-1">{permit.visitorName}</p>
        </div>

        {/* QR Code area */}
        {isValid && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              {/* In production: render actual QR code with a library */}
              <div className="text-center">
                <QrCode className="w-24 h-24 text-gray-800 mx-auto" />
                <p className="text-gray-500 text-[10px] mt-2 font-mono">{qrToken}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">Scan bij de slagboom</p>
          </div>
        )}

        {/* Details */}
        <div className="bg-white/[0.03] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#b8a472]" />
            <div>
              <p className="text-white/30 text-xs">Geldig</p>
              <p className="text-white text-sm">
                {validFrom.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                {" "}{validFrom.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                {" — "}
                {validUntil.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {permit.licensePlate && (
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-[#b8a472]" />
              <div>
                <p className="text-white/30 text-xs">Kenteken</p>
                <p className="text-white text-sm font-mono">{permit.licensePlate}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#b8a472]" />
            <div>
              <p className="text-white/30 text-xs">Toegang</p>
              <p className="text-white text-sm">
                {(permit.usedEntries || 0)}/{(permit.maxEntries || 1)} keer gebruikt
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {isValid && (
          <div className="bg-white/[0.03] rounded-2xl p-5">
            <h3 className="text-white text-sm font-medium mb-3">Hoe werkt het?</h3>
            <ol className="space-y-2 text-white/40 text-xs">
              <li className="flex gap-2">
                <span className="text-[#b8a472] font-medium">1.</span>
                Rijd naar de slagboom van het parkeerterrein
              </li>
              <li className="flex gap-2">
                <span className="text-[#b8a472] font-medium">2.</span>
                Scan de QR-code hierboven bij de scanner
              </li>
              <li className="flex gap-2">
                <span className="text-[#b8a472] font-medium">3.</span>
                De slagboom opent automatisch
              </li>
              <li className="flex gap-2">
                <span className="text-[#b8a472] font-medium">4.</span>
                Bij vertrek: rijd naar de uitgang, de slagboom herkent uw auto
              </li>
            </ol>
          </div>
        )}

        {permit.notes && (
          <div className="bg-white/[0.03] rounded-2xl p-5">
            <p className="text-white/30 text-xs mb-1">Opmerking van uw gastheer</p>
            <p className="text-white text-sm">{permit.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
