import { trpc } from "@/lib/trpc";
import SignageLayout from "./SignageLayout";
import { Building2, MapPin, Users, ArrowRight } from "lucide-react";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
  isDemo?: boolean;
}

const DEMO_COMPANIES = [
  { companyName: "TechVentures B.V.", buildingName: "Gebouw A", buildingCode: "A", floor: "2", roomNumber: "2.04", checkedInAt: new Date().toISOString() },
  { companyName: "GreenLeaf Consulting", buildingName: "Gebouw A", buildingCode: "A", floor: "1", roomNumber: "1.12", checkedInAt: new Date().toISOString() },
  { companyName: "Digital Nomads Hub", buildingName: "Gebouw B", buildingCode: "B", floor: "3", roomNumber: "3.01", checkedInAt: new Date().toISOString() },
  { companyName: "Sustainable Solutions", buildingName: "Gebouw A", buildingCode: "A", floor: "2", roomNumber: "2.08", checkedInAt: new Date().toISOString() },
  { companyName: "CreativeMinds Agency", buildingName: "Gebouw B", buildingCode: "B", floor: "1", roomNumber: "1.05", checkedInAt: new Date().toISOString() },
  { companyName: "FoodTech Innovations", buildingName: "Gebouw A", buildingCode: "A", floor: "3", roomNumber: "3.10", checkedInAt: new Date().toISOString() },
  { companyName: "CloudFirst IT", buildingName: "Gebouw C", buildingCode: "C", floor: "1", roomNumber: "1.02", checkedInAt: new Date().toISOString() },
  { companyName: "BioScience Labs", buildingName: "Gebouw C", buildingCode: "C", floor: "2", roomNumber: "2.06", checkedInAt: new Date().toISOString() },
];

const DEMO_BUILDINGS = [
  { id: 1, name: "Gebouw A — Het Groene Hart", code: "A", floors: 3 },
  { id: 2, name: "Gebouw B — De Werkplaats", code: "B", floors: 3 },
  { id: 3, name: "Gebouw C — Innovation Hub", code: "C", floors: 2 },
];

export default function SignageWayfindingDisplay({ config, time, locationId, onRefresh, isDemo }: Props) {
  const { data: wayfindingData } = trpc.signageDisplay.getWayfindingData.useQuery(
    { locationId },
    { enabled: !isDemo, refetchInterval: 30000 }
  );

  const buildings = isDemo ? DEMO_BUILDINGS : (wayfindingData?.buildings || []);
  const presentCompanies = isDemo ? DEMO_COMPANIES : (wayfindingData?.presentCompanies || []);

  // Group present companies by building
  const companiesByBuilding: Record<string, any[]> = {};
  presentCompanies.forEach((c: any) => {
    const key = c.buildingName || "Hoofdgebouw";
    if (!companiesByBuilding[key]) companiesByBuilding[key] = [];
    companiesByBuilding[key].push(c);
  });

  return (
    <SignageLayout theme="green" locationName={config.location?.name} time={time} footerText="Find your way" isDemo={isDemo}>
      <div className="h-full flex flex-col gap-5">
        {/* Title */}
        <div className="flex items-end justify-between shrink-0">
          <div>
            <div className="text-[9px] tracking-[5px] uppercase text-[#627653]/60 font-semibold mb-2">
              Wayfinding
            </div>
            <h2 className="text-[clamp(24px,4vw,36px)] font-black uppercase tracking-tight leading-none text-white">
              Who is in<br />today?
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.04] px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-[#627653]" />
            <span className="text-lg font-light text-[#627653]">{presentCompanies.length}</span>
            <span className="text-[10px] text-white/30">bedrijven</span>
          </div>
        </div>

        {/* Buildings with present companies */}
        <div className="flex-1 overflow-hidden">
          {buildings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full auto-rows-min overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
              {buildings.map((building: any) => {
                const buildingCompanies = companiesByBuilding[building.name] || [];
                return (
                  <div key={building.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.06]">
                      <div className="w-10 h-10 rounded-xl bg-[#627653]/15 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#627653]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-light">{building.name}</h3>
                        <div className="flex items-center gap-2">
                          {building.code && <span className="text-[9px] px-2 py-0.5 rounded bg-[#627653]/20 text-[#627653] font-semibold tracking-[1px]">{building.code}</span>}
                          <span className="text-[10px] text-white/30">{building.floors} verdieping{building.floors !== 1 ? "en" : ""}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-light text-[#627653]">{buildingCompanies.length}</div>
                        <div className="text-[8px] text-white/30 tracking-[1px] uppercase">aanwezig</div>
                      </div>
                    </div>

                    {buildingCompanies.length > 0 ? (
                      <div className="space-y-1.5">
                        {buildingCompanies.sort((a: any, b: any) => (a.floor || "").localeCompare(b.floor || "")).map((company: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                            <div className="w-8 h-8 rounded-lg bg-[#627653]/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {company.companyLogo ? (
                                <img src={company.companyLogo} alt="" className="w-5 h-5 object-contain" />
                              ) : (
                                <span className="text-xs font-semibold text-[#627653]">{(company.companyName || "?").charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-light truncate">{company.companyName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {company.floor && <span className="text-[9px] text-white/30">V{company.floor}</span>}
                                {company.roomNumber && <span className="text-[9px] text-white/30">K{company.roomNumber}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {company.floor && <span className="text-[10px] px-2 py-1 rounded bg-[#627653]/10 text-[#627653] font-mono">{company.floor}</span>}
                              <ArrowRight className="w-3.5 h-3.5 text-[#627653]/40" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-xs text-white/20">Geen bedrijven aanwezig</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : presentCompanies.length > 0 ? (
            <div className="space-y-2 overflow-y-auto h-full pr-1" style={{ scrollbarWidth: "none" }}>
              {presentCompanies.map((company: any, i: number) => (
                <div key={i} className="flex items-center gap-4 py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-[#627653]/10 flex items-center justify-center shrink-0">
                    <span className="text-base font-semibold text-[#627653]">{(company.companyName || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-light">{company.companyName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {company.buildingName && <span className="text-[10px] text-white/30">{company.buildingName}</span>}
                      {company.floor && <span className="text-[10px] text-white/30">V{company.floor}</span>}
                      {company.roomNumber && <span className="text-[10px] text-white/30">K{company.roomNumber}</span>}
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#627653] animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Building2 className="w-10 h-10 text-[#627653]/15 mx-auto mb-4" />
                <p className="text-lg font-light text-white/25">Nog geen bedrijven ingecheckt</p>
                <p className="text-xs text-white/15 mt-1">Bedrijven verschijnen hier zodra ze inchecken</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-between shrink-0 py-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#627653]/40" />
            <span className="text-[10px] text-white/25">{config.location?.name} — {buildings.length} gebouw{buildings.length !== 1 ? "en" : ""}</span>
          </div>
          <span className="text-[9px] text-white/15">Bijgewerkt: {time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </SignageLayout>
  );
}
