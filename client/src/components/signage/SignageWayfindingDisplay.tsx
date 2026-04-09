import { trpc } from "@/lib/trpc";
import SignageLayout from "./SignageLayout";
import { Building2, MapPin, ChevronRight, Users, ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
}

export default function SignageWayfindingDisplay({ config, time, locationId, onRefresh }: Props) {
  const { data: wayfindingData } = trpc.signageDisplay.getWayfindingData.useQuery(
    { locationId },
    { refetchInterval: 30000 } // Refresh every 30s for real-time presence
  );

  const buildings = wayfindingData?.buildings || [];
  const presentCompanies = wayfindingData?.presentCompanies || [];
  const allAssignments = wayfindingData?.allAssignments || [];

  // Group present companies by building
  const companiesByBuilding: Record<number, any[]> = {};
  presentCompanies.forEach((c: any) => {
    const bId = c.buildingId || 0;
    if (!companiesByBuilding[bId]) companiesByBuilding[bId] = [];
    companiesByBuilding[bId].push(c);
  });

  return (
    <SignageLayout
      theme="green"
      locationName={config.location?.name}
      time={time}
      footerText="Find your way"
    >
      <div className="h-full flex flex-col gap-5">
        {/* Title */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] tracking-[4px] uppercase text-[#627653]/60 font-semibold mb-2">
              Wayfinding — Vandaag aanwezig
            </div>
            <h2 className="text-3xl font-extralight">
              Wie is er <strong className="font-semibold">binnen?</strong>
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-[#627653]/10 px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-[#627653]" />
            <span className="text-sm text-[#627653] font-medium">{presentCompanies.length} bedrijven aanwezig</span>
          </div>
        </div>

        {/* Buildings with present companies */}
        <div className="flex-1 overflow-hidden">
          {buildings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full auto-rows-min">
              {buildings.map((building: any) => {
                const buildingCompanies = companiesByBuilding[building.id] || [];
                return (
                  <div
                    key={building.id}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 overflow-hidden"
                  >
                    {/* Building Header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.06]">
                      <div className="w-12 h-12 rounded-xl bg-[#627653]/15 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-[#627653]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-light">{building.name}</h3>
                        <div className="flex items-center gap-2">
                          {building.code && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#627653]/20 text-[#627653] font-semibold tracking-[1px]">
                              {building.code}
                            </span>
                          )}
                          <span className="text-[11px] text-white/30">{building.floors} verdieping{building.floors !== 1 ? "en" : ""}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-light text-[#627653]">{buildingCompanies.length}</div>
                        <div className="text-[9px] text-white/30 tracking-[1px] uppercase">aanwezig</div>
                      </div>
                    </div>

                    {/* Company List - Only show companies that are present */}
                    {buildingCompanies.length > 0 ? (
                      <div className="space-y-2">
                        {buildingCompanies.map((company: any, i: number) => (
                          <div
                            key={`${company.companyId}-${i}`}
                            className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]"
                          >
                            {/* Company Logo or Initial */}
                            <div className="w-9 h-9 rounded-lg bg-[#627653]/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {company.companyLogo ? (
                                <img src={company.companyLogo} alt="" className="w-6 h-6 object-contain" />
                              ) : (
                                <span className="text-sm font-semibold text-[#627653]">
                                  {(company.companyName || "?").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* Company Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-light truncate">{company.companyName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {company.floor && (
                                  <span className="text-[10px] text-white/30">Vloer {company.floor}</span>
                                )}
                                {company.roomNumber && (
                                  <span className="text-[10px] text-white/30">Kamer {company.roomNumber}</span>
                                )}
                              </div>
                            </div>

                            {/* Direction indicator */}
                            <div className="flex items-center gap-1 shrink-0">
                              {company.floor && (
                                <span className="text-[10px] px-2 py-1 rounded bg-[#627653]/10 text-[#627653] font-mono">
                                  {company.floor}
                                </span>
                              )}
                              <ArrowRight className="w-4 h-4 text-[#627653]/40" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <p className="text-sm text-white/20">Geen bedrijven aanwezig</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* No buildings configured - show flat list of present companies */
            <div className="space-y-2">
              {presentCompanies.length > 0 ? (
                presentCompanies.map((company: any, i: number) => (
                  <div
                    key={`${company.companyId}-${i}`}
                    className="flex items-center gap-4 py-4 px-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#627653]/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {company.companyLogo ? (
                        <img src={company.companyLogo} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-lg font-semibold text-[#627653]">
                          {(company.companyName || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-light">{company.companyName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {company.buildingName && (
                          <span className="text-[11px] text-white/30">{company.buildingName}</span>
                        )}
                        {company.floor && (
                          <span className="text-[11px] text-white/30">Vloer {company.floor}</span>
                        )}
                        {company.roomNumber && (
                          <span className="text-[11px] text-white/30">Kamer {company.roomNumber}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#627653] animate-pulse" />
                      <span className="text-[10px] text-[#627653] tracking-[1px] uppercase font-semibold">Aanwezig</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-20">
                    <Building2 className="w-12 h-12 text-[#627653]/20 mx-auto mb-4" />
                    <p className="text-xl font-light text-white/30">Nog geen bedrijven ingecheckt</p>
                    <p className="text-sm text-white/15 mt-2">Bedrijven verschijnen hier zodra ze inchecken</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-between shrink-0 py-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#627653]/40" />
            <span className="text-[11px] text-white/30">
              {config.location?.name} — {buildings.length} gebouw{buildings.length !== 1 ? "en" : ""}
            </span>
          </div>
          <span className="text-[10px] text-white/20">
            Laatst bijgewerkt: {time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </SignageLayout>
  );
}
