import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Mail, Plus, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const INVOICES = [
  { id: "INV-2026-001", company: "Acme Corp", amount: 1250.00, status: "paid", date: "2026-04-01", btw: 262.50 },
  { id: "INV-2026-002", company: "TechStart BV", amount: 2500.00, status: "sent", date: "2026-04-05", btw: 525.00 },
  { id: "INV-2026-003", company: "Growth Inc", amount: 1800.00, status: "draft", date: "2026-04-10", btw: 378.00 },
];

export default function InvoiceDashboard() {
  const [tab, setTab] = useState("list");
  const [filter, setFilter] = useState("");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light">Facturering</h1>
          <p className="text-xs text-muted-foreground mt-1">Maandelijkse facturen & creditnota's</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" />Factuur aanmaken</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="list">Factuurlijst</TabsTrigger><TabsTrigger value="detail">Details</TabsTrigger></TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Facturen ({INVOICES.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Zoeken..." value={filter} onChange={e => setFilter(e.target.value)} />
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
              </div>
              <div className="border rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="text-xs">Factuurnr</TableHead><TableHead className="text-xs">Bedrijf</TableHead><TableHead className="text-xs">Bedrag</TableHead><TableHead className="text-xs">BTW</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs text-right">Acties</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {INVOICES.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="text-xs font-mono">{inv.id}</TableCell>
                        <TableCell className="text-xs">{inv.company}</TableCell>
                        <TableCell className="text-xs font-semibold">€{inv.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-xs">€{inv.btw.toFixed(2)}</TableCell>
                        <TableCell className="text-xs"><Badge variant={inv.status === "paid" ? "default" : inv.status === "sent" ? "secondary" : "outline"}>{inv.status}</Badge></TableCell>
                        <TableCell className="text-right gap-2 flex justify-end"><Button variant="outline" size="sm"><Download className="w-4 h-4" /></Button><Button variant="outline" size="sm"><Mail className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Factuurdetails</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p><strong>Factuurnummer:</strong> INV-2026-002</p>
                <p><strong>Bedrijf:</strong> TechStart BV | BTW: NL123456789 | KvK: 12345678</p>
                <p><strong>Bedrag:</strong> €2500.00 | <strong>BTW (21%):</strong> €525.00 | <strong>Totaal:</strong> €3025.00</p>
                <p><strong>Status:</strong> <Badge>Sent</Badge></p>
                <div className="flex gap-2"><Button>Download PDF</Button><Button variant="outline">Creditnota aanmaken</Button></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
