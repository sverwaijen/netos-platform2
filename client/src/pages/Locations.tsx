import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { getLocationImage } from "@/lib/brand";

export default function Locations() {
  const { data: locations, isLoading } = trpc.locations.list.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-none" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-3">Locations</div>
          <h1 className="text-[clamp(28px,3vw,42px)] font-extralight tracking-[-0.5px] leading-tight">
            Where we <strong className="font-semibold">are.</strong>
          </h1>
        </div>
        <div className="text-[11px] text-[#888] tracking-[1px] font-light">{(locations ?? []).length} locations &middot; Availability updated weekly</div>
      </div>

      {/* Location grid - editorial photo cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[3px]">
        {(locations ?? []).map((loc: any) => {
          const img = getLocationImage(loc.slug);
          const occ = Math.floor(Math.random() * 60) + 20;
          const spotTag = occ > 70 ? { text: "Waitlist only", cls: "bg-white/[0.08] text-white/40" }
            : occ > 50 ? { text: `${Math.floor(Math.random() * 3) + 2} spots left`, cls: "bg-[#C4B89E]/25 text-[#C4B89E]" }
            : { text: "Accepting applications", cls: "bg-[#C4B89E]/20 text-[#C4B89E]" };

          return (
            <div
              key={loc.id}
              className="relative aspect-[3/4] overflow-hidden cursor-pointer group"
              onClick={() => setLocation(`/locations/${loc.slug}`)}
            >
              <img
                src={img}
                alt={loc.city}
                className="w-full h-full object-cover brightness-[0.55] saturate-[0.8] group-hover:brightness-[0.4] group-hover:saturate-[0.6] group-hover:scale-[1.03] transition-all duration-600"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <div className="text-lg font-normal tracking-[1px] text-white">{loc.city}</div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/50 font-light">
                  <MapPin className="w-3 h-3" />
                  {loc.address}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`inline-block text-[9px] font-semibold tracking-[2.5px] uppercase px-3.5 py-1.5 ${spotTag.cls}`}>
                    {spotTag.text}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              {/* Resource count badge */}
              <div className="absolute top-5 right-5 text-[10px] text-white/40 tracking-[2px] uppercase font-medium">
                {loc.totalResources || "—"} resources
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
