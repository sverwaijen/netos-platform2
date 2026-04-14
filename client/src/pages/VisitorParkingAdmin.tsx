import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, QrCode, Car, Clock, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PERMITS = [
  { id: "1", name: "John Doe", plate: "AB-12-CD", slot: "09:00-17:00", status: "verified", spot: "V-01" },
  { id: "2", name: "Jane Smith", plate: "EF-34-GH", slot: "10:00-18:00", status: "active", spot: "V-02" },
];

export default function VisitorParkingAdmin() {
  const [tab, setTab] = useState("permits");
  const [plate, setPlate] = useState("");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light">Bezoekerparkeerpermits</h1>
          <p className="text-xs text-muted-foreground mt-1">Vergunningen & ANPR verificatie</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Vergunning aanmaken</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nieuwe vergunning</DialogTitle></DialogHeader>
            <Input placeholder="Bezoekernaam" />
            <Input placeholder="Kenteken" />
            <Button className="w-full">Aanmaken</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="permits">Vergunningen</TabsTrigger><TabsTrigger value="anpr">ANPR</TabsTrigger><TabsTrigger value="spots">Beschikbaarheid</TabsTrigger></TabsList>

        <TabsContent value="permits" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Actieve Vergunningen ({PERMITS.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="border rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="text-xs">Bezoeker</TableHead><TableHead className="text-xs">Kenteken</TableHead><TableHead className="text-xs">Tijdslot</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Plek</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMITS.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">{p.name}</TableCell>
                        <TableCell className="text-xs font-mono">{p.plate}</TableCell>
                        <TableCell className="text-xs"><Clock className="w-3 h-3 inline mr-1" />{p.slot}</TableCell>
                        <TableCell className="text-xs"><Badge variant="secondary">{p.status}</Badge></TableCell>
                        <TableCell className="text-xs">{p.spot}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anpr" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">ANPR Verificatie</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Kenteken" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} />
                <Button onClick={() => {const f = PERMITS.find(p => p.plate === plate); f ? toast.success("Match!") : toast.error("Geen vergunning");}}>Verifiëer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spots" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Beschikbaarheid</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {[{n:"V-01",s:"occupied"},{n:"V-02",s:"occupied"},{n:"V-03",s:"available"},{n:"V-04",s:"available"},{n:"V-05",s:"reserved"}].map(s => (
                  <div key={s.n} className={`p-3 rounded text-center text-xs font-semibold ${s.s === "available" ? "bg-green-100 text-green-700" : s.s === "occupied" ? "bg-[#b8a472] text-white" : "bg-blue-100 text-blue-700"}`}>{s.n}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
