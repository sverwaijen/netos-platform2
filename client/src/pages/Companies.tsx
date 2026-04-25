import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, Search, Users, CreditCard, Crown, Plus } from "lucide-react";
import { useState, useMemo } from "react";

const TIER_COLORS: Record<string, string> = { gold: "#C4B89E", silver: "#888", bronze: "#8B6914" };

export default function Companies() {
  const { data: companies, isLoading } = trpc.companies.list.useQuery();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const filtered = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c: any) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === "all" || c.tier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [companies, search, tierFilter]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { gold: 0, silver: 0, bronze: 0 };
    (companies ?? []).forEach((c: any) => { if (counts[c.tier] !== undefined) counts[c.tier]++; });
    return counts;
  }, [companies]);

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-3">Network</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Member <strong className="font-semibold">companies.</strong>
          </h1>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-[#C4B89E] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all">
          <Plus className="w-3.5 h-3.5" />Add company
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        <div className="bg-[#111] p-5">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">Total</div>
          <div className="text-2xl font-extralight">{(companies ?? []).length}</div>
        </div>
        {(["gold", "silver", "bronze"] as const).map((tier) => (
          <div key={tier} className="bg-[#111] p-5">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1 flex items-center gap-1">
              <Crown className="w-3 h-3" style={{ color: TIER_COLORS[tier] }} />{tier}
            </div>
            <div className="text-2xl font-extralight">{tierCounts[tier]}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div className="flex gap-0 border border-white/[0.06]">
          {["all", "gold", "silver", "bronze"].map((t) => (
            <button key={t} onClick={() => setTierFilter(t)} className={`px-4 py-2 text-[10px] font-semibold tracking-[2px] uppercase transition-all ${tierFilter === t ? "bg-white/[0.06] text-white" : "text-[#888] hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[#888]">{filtered.length} found</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
          <p className="text-sm text-[#888] font-light">No companies found.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: `${c.primaryColor || "#C4B89E"}20` }}>
                  {c.logoUrl ? <img src={c.logoUrl} alt="" className="w-6 h-6 object-contain" /> : <Building2 className="w-5 h-5" style={{ color: c.primaryColor || "#C4B89E" }} />}
                </div>
                <div>
                  <p className="text-sm font-light">{c.name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-[#888] mt-0.5">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.memberCount ?? 0} members</span>
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{c.discountPercent ?? 0}% discount</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.primaryColor ?? "#C4B89E" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.secondaryColor ?? "#C4B89E" }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" style={{ color: TIER_COLORS[c.tier] || "#888" }} />
                  <span className="text-[10px] font-semibold tracking-[2px] uppercase" style={{ color: TIER_COLORS[c.tier] || "#888" }}>{c.tier}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-light text-lg">Add company</DialogTitle></DialogHeader>
          <div>
            <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Company Name</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Acme Corp" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-white/10 bg-transparent">Cancel</Button>
            <Button onClick={() => { toast.success("Company creation request submitted."); setCreateOpen(false); setNewName(""); }} disabled={!newName} className="bg-[#C4B89E] text-white hover:bg-[#4a5a3f]">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
