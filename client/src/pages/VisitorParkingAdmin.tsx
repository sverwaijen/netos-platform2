import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, QrCode, Car, Clock, Users, AlertCircle, Mail, Check, X,
  Search, Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VisitorParkingPermit {
  id: string;
  visitorName: string;
  licensePlate: string;
  invitationId: string;
  qrToken: string;
  status: "pending" | "active" | "verified" | "expired" | "cancelled";
  createdAt: Date;
  expiresAt: Date;
  timeSlot: { startTime: string; endTime: string; };
  spotAssigned?: string;
  verifiedAt?: Date;
  emailSent: boolean;
}

const MOCK_PERMITS: VisitorParkingPermit[] = [
  {
    id: "permit_001",
    visitorName: "John Doe",
    licensePlate: "AB-12-CD",
    invitationId: "inv_001",
    qrToken: "qr_token_001",
    status: "verified",
    createdAt: new Date(2026, 3, 10),
    expiresAt: new Date(2026, 3, 11),
    timeSlot: { startTime: "09:00", endTime: "17:00" },
    spotAssigned: "V-01",
    verifiedAt: new Date(2026, 3, 10, 9, 15),
    emailSent: true,
  },
];

const MOCK_SPOTS = [
  { id: "v1", number: "V-01", status: "occupied", type: "visitor" },
  { id: "v2", number: "V-02", status: "occupied", type: "visitor" },
  { id: "v3", number: "V-03", status: "available", type: "visitor" },
  { id: "v4", number: "V-04", status: "available", type: "visitor" },
  { id: "v5", number: "V-05", status: "reserved", type: "visitor" },
];

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: <Clock className="w-3 h-3" /> },
    active: { bg: "bg-blue-100", text: "text-blue-700", icon: <Car className="w-3 h-3" /> },
    verified: { bg: "bg-green-100", text: "text-green-700", icon: <Check className="w-3 h-3" /> },
    expired: { bg: "bg-gray-100", text: "text-gray-700", icon: <X className="w-3 h-3" /> },
    cancelled: { bg: "bg-red-100", text: "text-red-700", icon: <X className="w-3 h-3" /> },
  };
  const v = variants[status] || variants.pending;
  return (
    <Badge className={`${v.bg} ${v.text} flex items-center gap-1`}>
      {v.icon}
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </Badge>
  );
}

function ParkingAvailabilityGauge() {
  const occupied = MOCK_SPOTS.filter((s: any) => s.status === "occupied").length;
  const available = MOCK_SPOTS.filter((s: any) => s.status === "available").length;
  const reserved = MOCK_SPOTS.filter((s: any) => s.status === "reserved").length;
  const percent = Math.round((occupied / MOCK_SPOTS.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Beschikbaarheid Bezoekerplaatsen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Bezet</span>
            <span className="font-semibold">{percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#b8a472] h-2 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-500">Beschikbaar</p>
            <p className="text-lg font-semibold text-green-600">{available}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-500">Bezet</p>
            <p className="text-lg font-semibold text-[#b8a472]">{occupied}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-500">Gereserveerd</p>
            <p className="text-lg font-semibold text-blue-600">{reserved}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePermitDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: "",
    licensePlate: "",
    invitationId: "",
    startTime: "09:00",
    endTime: "17:00",
  });

  const handleCreate = () => {
    if (!formData.visitorName || !formData.licensePlate || !formData.invitationId) {
      toast.error("Vul alle velden in");
      return;
    }
    toast.success("Parkeervergunning aangemaakt");
    setOpen(false);
    setFormData({ visitorName: "", licensePlate: "", invitationId: "", startTime: "09:00", endTime: "17:00" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Vergunning aanmaken
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe bezoekervergunning</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Volledige naam" value={formData.visitorName} onChange={(e) => setFormData(p => ({ ...p, visitorName: e.target.value }))} />
          <Input placeholder="AB-12-CD" value={formData.licensePlate} onChange={(e) => setFormData(p => ({ ...p, licensePlate: e.target.value }))} />
          <Input placeholder="inv_XXXXX" value={formData.invitationId} onChange={(e) => setFormData(p => ({ ...p, invitationId: e.target.value }))} />
          <Button onClick={handleCreate} className="w-full">Aanmaken</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function VisitorParkingAdmin() {
  const [activeTab, setActiveTab] = useState("permits");
  const [searchTerm, setSearchTerm] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerify = () => {
    if (!licensePlate.trim()) return;
    const found = MOCK_PERMITS.find(p => p.licensePlate.toUpperCase() === licensePlate.toUpperCase());
    setVerificationResult({
      matched: !!found,
      permitId: found?.id,
      visitor: found?.visitorName,
      plate: found?.licensePlate,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Bezoekerparkeerpermits</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Vergunningen, ANPR verificatie & realtime beschikbaarheid</p>
        </div>
        <CreatePermitDialog />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permits">Vergunningen</TabsTrigger>
          <TabsTrigger value="anpr">ANPR</TabsTrigger>
          <TabsTrigger value="spots">Beschikbaarheid</TabsTrigger>
        </TabsList>

        <TabsContent value="permits" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actieve Vergunningen</CardTitle>
              <CardDescription>{MOCK_PERMITS.length} vergunningen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Zoeken op naam of kenteken..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Bezoeker</TableHead>
                      <TableHead className="text-xs">Kenteken</TableHead>
                      <TableHead className="text-xs">Tijdslot</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Plek</TableHead>
                      <TableHead className="text-xs text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_PERMITS.map(permit => (
                      <TableRow key={permit.id}>
                        <TableCell className="text-xs">{permit.visitorName}</TableCell>
                        <TableCell className="text-xs font-mono">{permit.licensePlate}</TableCell>
                        <TableCell className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{permit.timeSlot.startTime} - {permit.timeSlot.endTime}</TableCell>
                        <TableCell className="text-xs"><StatusBadge status={permit.status} /></TableCell>
                        <TableCell className="text-xs">{permit.spotAssigned && <Badge variant="secondary">{permit.spotAssigned}</Badge>}</TableCell>
                        <TableCell className="text-right"><Button variant="outline" size="sm"><QrCode className="w-4 h-4 mr-1" />QR</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anpr" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ANPR Verificatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Kenteken (bijv. AB-12-CD)" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && handleVerify()} className="flex-1" />
                <Button onClick={handleVerify} size="sm">Verifiëer</Button>
              </div>
              {verificationResult && (
                <div className={`p-3 rounded-lg border ${verificationResult.matched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  {verificationResult.matched ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Vergunning gevonden: {verificationResult.visitor}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Geen geldige vergunning</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spots" className="space-y-4 mt-4">
          <ParkingAvailabilityGauge />
        </TabsContent>
      </Tabs>
    </div>
  );
}
