import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users, Search, Plus, Filter, Crown, Building2, CreditCard,
  Mail, Phone, Linkedin, MapPin, Calendar, MoreHorizontal, Star, UserCheck, UserPlus
} from "lucide-react";

const TIER_CONFIG = {
  gebaloteerd: { label: "Gebaloteerd", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Crown, desc: "Volledig lid, gebaloteerd door de community" },
  vergaderen: { label: "Vergaderen", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Building2, desc: "Mag vergaderruimtes boeken" },
  prospect: { label: "Prospect", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: CreditCard, desc: "Creditbundel, nog geen lid" },
};

export default function MemberDatabase() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newMember, setNewMember] = useState({ displayName: "", email: "", companyName: "", jobTitle: "", tier: "prospect" as string, notes: "" });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: members, refetch } = trpc.memberProfiles.list.useQuery({
    search: search || undefined,
    tier: tierFilter !== "all" ? tierFilter : undefined,
  });
  const { data: stats } = trpc.memberProfiles.stats.useQuery();

  const createMut = trpc.memberProfiles.create.useMutation({
    onSuccess: () => { refetch(); setShowCreate(false); toast.success("Lid toegevoegd"); setNewMember({ displayName: "", email: "", companyName: "", jobTitle: "", tier: "prospect", notes: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.memberProfiles.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Bijgewerkt"); },
  });
  const bulkTierMut = trpc.memberProfiles.bulkUpdateTier.useMutation({
    onSuccess: (res) => { refetch(); setSelectedIds([]); toast.success(`${res.count} leden bijgewerkt`); },
  });

  function toggleSelect(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-green-400" />
            Ledenbestand
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Alle leden, vergaderleden en prospects in één overzicht
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" /> Lid Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">Nieuw Lid Toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-zinc-300">Naam *</Label>
                <Input value={newMember.displayName} onChange={e => setNewMember({ ...newMember, displayName: e.target.value })}
                  placeholder="Volledige naam" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">Email</Label>
                <Input value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="email@bedrijf.nl" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">Bedrijf</Label>
                <Input value={newMember.companyName} onChange={e => setNewMember({ ...newMember, companyName: e.target.value })}
                  placeholder="Bedrijfsnaam" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">Functie</Label>
                <Input value={newMember.jobTitle} onChange={e => setNewMember({ ...newMember, jobTitle: e.target.value })}
                  placeholder="CEO, CTO, etc." className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">Tier</Label>
                <Select value={newMember.tier} onValueChange={v => setNewMember({ ...newMember, tier: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="prospect" className="text-white">Prospect (creditbundel)</SelectItem>
                    <SelectItem value="vergaderen" className="text-white">Vergaderen</SelectItem>
                    <SelectItem value="gebaloteerd" className="text-white">Gebaloteerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Notities</Label>
                <Textarea value={newMember.notes} onChange={e => setNewMember({ ...newMember, notes: e.target.value })}
                  placeholder="Optionele notities..." className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <Button onClick={() => createMut.mutate(newMember as any)} disabled={!newMember.displayName || createMut.isPending}
                className="w-full bg-green-600 hover:bg-green-700">
                {createMut.isPending ? "Toevoegen..." : "Lid Toevoegen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Totaal", value: stats?.total || 0, icon: Users, color: "text-white" },
          { label: "Gebaloteerd", value: stats?.gebaloteerd || 0, icon: Crown, color: "text-amber-400" },
          { label: "Vergaderen", value: stats?.vergaderen || 0, icon: Building2, color: "text-blue-400" },
          { label: "Prospects", value: stats?.prospect || 0, icon: CreditCard, color: "text-zinc-400" },
          { label: "Actief", value: stats?.active || 0, icon: UserCheck, color: "text-green-400" },
        ].map(s => (
          <Card key={s.label} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-3 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-zinc-400">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op naam, bedrijf of email..."
            className="pl-9 bg-zinc-900/50 border-zinc-800 text-white" />
        </div>
        <div className="flex gap-2">
          {["all", "gebaloteerd", "vergaderen", "prospect"].map(t => (
            <Button key={t} size="sm" variant={tierFilter === t ? "default" : "outline"}
              onClick={() => setTierFilter(t)}
              className={tierFilter === t ? "bg-green-600" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}>
              {t === "all" ? "Alle" : TIER_CONFIG[t as keyof typeof TIER_CONFIG]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="bg-green-900/20 border-green-800/50">
          <CardContent className="p-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-green-300">{selectedIds.length} geselecteerd</span>
            <Button size="sm" variant="outline" onClick={() => bulkTierMut.mutate({ ids: selectedIds, tier: "gebaloteerd" })}
              className="border-amber-700 text-amber-300 hover:bg-amber-900/30">
              <Crown className="h-3 w-3 mr-1" /> → Gebaloteerd
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkTierMut.mutate({ ids: selectedIds, tier: "vergaderen" })}
              className="border-blue-700 text-blue-300 hover:bg-blue-900/30">
              <Building2 className="h-3 w-3 mr-1" /> → Vergaderen
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkTierMut.mutate({ ids: selectedIds, tier: "prospect" })}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <CreditCard className="h-3 w-3 mr-1" /> → Prospect
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="text-zinc-400">
              Deselecteer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {members?.map((member: any) => {
          const tier = TIER_CONFIG[member.tier as keyof typeof TIER_CONFIG];
          const TierIcon = tier?.icon || Users;
          const isSelected = selectedIds.includes(member.id);
          return (
            <Card key={member.id} className={`bg-zinc-900/50 border-zinc-800 cursor-pointer transition-colors ${isSelected ? "ring-1 ring-green-500/50" : "hover:border-zinc-700"}`}
              onClick={() => toggleSelect(member.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar/Tier */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${member.tier === "gebaloteerd" ? "bg-amber-500/20" : member.tier === "vergaderen" ? "bg-blue-500/20" : "bg-zinc-800"}`}>
                    <TierIcon className={`h-5 w-5 ${member.tier === "gebaloteerd" ? "text-amber-400" : member.tier === "vergaderen" ? "text-blue-400" : "text-zinc-400"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-white">{member.displayName}</h3>
                      <Badge className={tier?.color || ""}>{tier?.label}</Badge>
                      {member.creditBundleType && (
                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                          {member.creditBundleType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-400">
                      {member.companyName && (
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {member.companyName}</span>
                      )}
                      {member.jobTitle && <span>{member.jobTitle}</span>}
                      {member.email && (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {member.email}</span>
                      )}
                      {member.locationPreference && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {member.locationPreference}</span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400 shrink-0">
                    {member.creditBalance && parseFloat(member.creditBalance) > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-green-400">{parseFloat(member.creditBalance).toFixed(0)}</p>
                        <p>credits</p>
                      </div>
                    )}
                    {(member.totalBookings ?? 0) > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">{member.totalBookings}</p>
                        <p>boekingen</p>
                      </div>
                    )}
                    {member.ballotDate && (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-amber-400">
                          {new Date(member.ballotDate).toLocaleDateString("nl-NL", { month: "short", year: "numeric" })}
                        </p>
                        <p>gebaloteerd</p>
                      </div>
                    )}
                  </div>

                  {/* Tier change dropdown */}
                  <Select value={member.tier} onValueChange={v => { updateMut.mutate({ id: member.id, tier: v as any }); }}>
                    <SelectTrigger className="w-auto bg-transparent border-none text-zinc-400 hover:text-white p-1" onClick={e => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="prospect" className="text-white">Prospect</SelectItem>
                      <SelectItem value="vergaderen" className="text-white">Vergaderen</SelectItem>
                      <SelectItem value="gebaloteerd" className="text-white">Gebaloteerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!members || members.length === 0) && (
          <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-zinc-400">Geen leden gevonden</h3>
              <p className="text-sm text-zinc-500 mt-1">Voeg leden toe of pas je filters aan</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
