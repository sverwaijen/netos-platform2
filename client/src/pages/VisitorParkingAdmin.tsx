import { useAuth } from "@/_core/hooks/useAuth";

import { trpc } from "@/lib/trpc";
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

  ChevronRight, Search, Filter, Download
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

  timeSlot: {
    startTime: string;
    endTime: string;
  };
  spotAssigned?: string;
  verifiedAt?: Date;
  emailSent: boolean;
}


interface ParkingSpot {
  id: string;
  number: string;
  status: "available" | "occupied" | "reserved";
  type: "visitor" | "standard" | "premium";
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

  {
    id: "permit_002",
    visitorName: "Jane Smith",
    licensePlate: "EF-34-GH",
    invitationId: "inv_002",
    qrToken: "qr_token_002",
    status: "active",
    createdAt: new Date(2026, 3, 12),
    expiresAt: new Date(2026, 3, 13),
    timeSlot: { startTime: "10:00", endTime: "18:00" },
    spotAssigned: "V-02",
    emailSent: true,
  },
  {
    id: "permit_003",
    visitorName: "Bob Johnson",
    licensePlate: "IJ-56-KL",
    invitationId: "inv_003",
    qrToken: "qr_token_003",
    status: "pending",
    createdAt: new Date(2026, 3, 13),
    expiresAt: new Date(2026, 3, 14),
    timeSlot: { startTime: "08:00", endTime: "16:00" },
    emailSent: false,
  },
];

const MOCK_SPOTS: ParkingSpot[] = [
  { id: "v1", number: "V-01", status: "occupied", type: "visitor" },
  { id: "v2", number: "V-02", status: "occupied", type: "visitor" },
  { id: "v3", number: "V-03", status: "available", type: "visitor" },
  { id: "v4", number: "V-04", status: "available", type: "visitor" },
  { id: "v5", number: "V-05", status: "reserved", type: "visitor" },
];


function StatusBadge({ status }: { status: VisitorParkingPermit["status"] }) {
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


function QRPreviewModal({ permit }: { permit: VisitorParkingPermit }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="w-4 h-4 mr-1" />
          QR
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parkeervergunning QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded">
            <div className="text-center">
              <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">QR Code Simulation</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{permit.qrToken}</p>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>Bezoeker: {permit.visitorName}</p>
            <p>Kenteken: {permit.licensePlate}</p>
            <p>{permit.timeSlot.startTime} - {permit.timeSlot.endTime}</p>
          </div>
          <Button size="sm" className="w-full">Download QR</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ANPRVerificationWidget() {
  const [licensePlate, setLicensePlate] = useState("");
  const [verificationResult, setVerificationResult] = useState<null | {
    matched: boolean;
    permitId?: string;
    visitor?: string;
    plate?: string;
  }>(null);

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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">ANPR Verificatie</CardTitle>
        <CardDescription>Kennetekenherkenning simulatie</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Kenteken (bijv. AB-12-CD)"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            className="flex-1"
          />
          <Button onClick={handleVerify} size="sm">Verifiëer</Button>
        </div>

        {verificationResult && (
          <div className={`p-3 rounded-lg border ${
            verificationResult.matched
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}>
            {verificationResult.matched ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Vergunning gevonden</span>
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <p><strong>Bezoeker:</strong> {verificationResult.visitor}</p>
                  <p><strong>Kenteken:</strong> {verificationResult.plate}</p>
                  <p><strong>Permit ID:</strong> {verificationResult.permitId}</p>
                </div>
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
  );
}

function ParkingAvailabilityGauge() {
  const occupied = MOCK_SPOTS.filter(s => s.status === "occupied").length;
  const available = MOCK_SPOTS.filter(s => s.status === "available").length;
  const reserved = MOCK_SPOTS.filter(s => s.status === "reserved").length;
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

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#627653]">Bezoekernaam</label>
            <Input
              placeholder="Volledige naam"
              value={formData.visitorName}
              onChange={(e) => setFormData(p => ({ ...p, visitorName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#627653]">Kenteken</label>
            <Input
              placeholder="AB-12-CD"
              value={formData.licensePlate}
              onChange={(e) => setFormData(p => ({ ...p, licensePlate: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#627653]">Uitnodigings-ID</label>
            <Input
              placeholder="inv_XXXXX"
              value={formData.invitationId}
              onChange={(e) => setFormData(p => ({ ...p, invitationId: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#627653]">Start</label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#627653]">Einde</label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">Aanmaken</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function VisitorParkingAdmin() {

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("permits");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredPermits = MOCK_PERMITS.filter(permit => {
    const matchesSearch = permit.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permit.licensePlate.includes(searchTerm);
    const matchesStatus = !statusFilter || permit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Bezoekerparkeerpermits</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Vergunningen, ANPR verificatie & realtime beschikbaarheid</p>
        </div>
        <CreatePermitDialog />
      </div>


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permits" className="text-xs">Vergunningen</TabsTrigger>
          <TabsTrigger value="anpr" className="text-xs">ANPR</TabsTrigger>
          <TabsTrigger value="spots" className="text-xs">Beschikbaarheid</TabsTrigger>
        </TabsList>

        {/* Permits Tab */}
        <TabsContent value="permits" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actieve Vergunningen</CardTitle>

              <CardDescription>{filteredPermits.length} vergunningen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search & Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoeken op naam of kenteken..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>


              {/* Status filter buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                >
                  Alles
                </Button>
                {["pending", "active", "verified", "expired", "cancelled"].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Bezoeker</TableHead>
                      <TableHead className="text-xs">Kenteken</TableHead>
                      <TableHead className="text-xs">Tijdslot</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Plek</TableHead>

                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>

                    {filteredPermits.map(permit => (
                      <TableRow key={permit.id}>
                        <TableCell className="text-xs">{permit.visitorName}</TableCell>
                        <TableCell className="text-xs font-mono">{permit.licensePlate}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {permit.timeSlot.startTime} - {permit.timeSlot.endTime}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <StatusBadge status={permit.status} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {permit.spotAssigned ? (
                            <Badge variant="secondary" className="text-xs">{permit.spotAssigned}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {permit.emailSent ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <QRPreviewModal permit={permit} />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.success("Email verzonden naar bezoeker")}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* ANPR Tab */}
        <TabsContent value="anpr" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ANPRVerificationWidget />
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recente ANPR Scans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  {[
                    { time: "14:35", plate: "AB-12-CD", result: "✓ Geldige vergunning" },
                    { time: "14:12", plate: "EF-34-GH", result: "✓ Geldige vergunning" },
                    { time: "13:58", plate: "XY-99-ZZ", result: "✗ Geen vergunning" },
                  ].map((scan, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-muted-foreground">{scan.time}</span>
                      <span className="font-mono">{scan.plate}</span>
                      <span className={scan.result.startsWith("✓") ? "text-green-600" : "text-red-600"}>
                        {scan.result}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Spots Tab */}
        <TabsContent value="spots" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ParkingAvailabilityGauge />
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Parkeerplekken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {MOCK_SPOTS.map(spot => (
                    <div
                      key={spot.id}
                      className={`p-3 rounded text-center text-xs font-semibold cursor-pointer transition-all ${
                        spot.status === "available"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : spot.status === "occupied"
                          ? "bg-[#b8a472] text-white hover:bg-opacity-90"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      <div>{spot.number}</div>
                      <div className="text-xs mt-1 text-opacity-70">
                        {spot.status === "available" ? "Vrij" : spot.status === "occupied" ? "Bezet" : "Gereserveerd"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
