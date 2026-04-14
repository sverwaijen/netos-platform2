import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Check, X, Clock, BarChart3, Bell } from "lucide-react";

interface ApprovalSettings {
  companyId: string;
  companyName: string;
  requireApproval: boolean;
  autoApproveThreshold: number; // credits
}

interface PendingBooking {
  id: string;
  resourceName: string;
  location: string;
  resourceType: string;
  bookerName: string;
  bookerEmail: string;
  startTime: Date;
  endTime: Date;
  creditsRequested: number;
  requestedAt: Date;
  reason?: string;
}

interface ApprovalAction {
  id: string;
  bookingId: string;
  action: "approved" | "rejected";
  approverName: string;
  approverEmail: string;
  timestamp: Date;
  comment?: string;
}

// Demo data
const DEMO_COMPANIES: ApprovalSettings[] = [
  {
    companyId: "company-1",
    companyName: "Acme Corp",
    requireApproval: true,
    autoApproveThreshold: 20,
  },
  {
    companyId: "company-2",
    companyName: "TechStart Inc",
    requireApproval: true,
    autoApproveThreshold: 10,
  },
  {
    companyId: "company-3",
    companyName: "Global Solutions",
    requireApproval: false,
    autoApproveThreshold: 0,
  },
];

const DEMO_PENDING_BOOKINGS: PendingBooking[] = [
  {
    id: "pending-1",
    resourceName: "Desk 301",
    location: "Amsterdam",
    resourceType: "desk",
    bookerName: "John Doe",
    bookerEmail: "john@example.com",
    startTime: new Date(2026, 3, 15, 9, 0),
    endTime: new Date(2026, 3, 15, 12, 0),
    creditsRequested: 15,
    requestedAt: new Date(2026, 3, 14, 14, 30),
    reason: "Client meeting scheduled",
  },
  {
    id: "pending-2",
    resourceName: "Meeting Room A",
    location: "Amsterdam",
    resourceType: "meeting_room",
    bookerName: "Jane Smith",
    bookerEmail: "jane@example.com",
    startTime: new Date(2026, 3, 16, 13, 0),
    endTime: new Date(2026, 3, 16, 14, 0),
    creditsRequested: 25,
    requestedAt: new Date(2026, 3, 14, 10, 15),
  },
  {
    id: "pending-3",
    resourceName: "Parking Spot A-05",
    location: "Amsterdam",
    resourceType: "parking",
    bookerName: "Bob Wilson",
    bookerEmail: "bob@example.com",
    startTime: new Date(2026, 3, 17, 8, 0),
    endTime: new Date(2026, 3, 17, 17, 0),
    creditsRequested: 30,
    requestedAt: new Date(2026, 3, 14, 9, 0),
    reason: "All-day parking for client visit",
  },
];

const DEMO_APPROVAL_HISTORY: ApprovalAction[] = [
  {
    id: "approval-1",
    bookingId: "booking-101",
    action: "approved",
    approverName: "Admin User",
    approverEmail: "admin@example.com",
    timestamp: new Date(2026, 3, 13, 15, 30),
    comment: "Approved - within budget",
  },
  {
    id: "approval-2",
    bookingId: "booking-102",
    action: "rejected",
    approverName: "Admin User",
    approverEmail: "admin@example.com",
    timestamp: new Date(2026, 3, 13, 14, 15),
    comment: "Exceeds team budget for this period",
  },
  {
    id: "approval-3",
    bookingId: "booking-103",
    action: "approved",
    approverName: "Finance Manager",
    approverEmail: "finance@example.com",
    timestamp: new Date(2026, 3, 13, 11, 0),
  },
];

export default function BookingApprovalPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [companies, setCompanies] = useState(DEMO_COMPANIES);
  const [pendingBookings, setPendingBookings] = useState(DEMO_PENDING_BOOKINGS);
  const [approvalHistory, setApprovalHistory] = useState(DEMO_APPROVAL_HISTORY);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [selectedCompanyForSettings, setSelectedCompanyForSettings] = useState(
    companies[0].companyId
  );

  const selectedCompanySettings = useMemo(
    () => companies.find((c) => c.companyId === selectedCompanyForSettings),
    [companies, selectedCompanyForSettings]
  );

  const handleApproveBooking = () => {
    if (!selectedBooking) return;

    // Create approval record
    const newAction: ApprovalAction = {
      id: `approval-${Date.now()}`,
      bookingId: selectedBooking.id,
      action: "approved",
      approverName: "Current User",
      approverEmail: "current@example.com",
      timestamp: new Date(),
      comment: approvalComment || undefined,
    };

    setApprovalHistory([newAction, ...approvalHistory]);
    setPendingBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
    setShowApprovalModal(false);
    setApprovalComment("");
    setSelectedBooking(null);
  };

  const handleRejectBooking = () => {
    if (!selectedBooking) return;

    // Create rejection record
    const newAction: ApprovalAction = {
      id: `approval-${Date.now()}`,
      bookingId: selectedBooking.id,
      action: "rejected",
      approverName: "Current User",
      approverEmail: "current@example.com",
      timestamp: new Date(),
      comment: approvalComment || "Request declined",
    };

    setApprovalHistory([newAction, ...approvalHistory]);
    setPendingBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
    setShowApprovalModal(false);
    setApprovalComment("");
    setSelectedBooking(null);
  };

  const updateCompanySettings = (companyId: string, requireApproval: boolean, threshold: number) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.companyId === companyId
          ? { ...c, requireApproval, autoApproveThreshold: threshold }
          : c
      )
    );
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const formatDateTime = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">
            BOOKING APPROVALS
          </div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Approval <strong className="font-semibold">workflow.</strong>
          </h1>
        </div>
        <Button
          onClick={() => setShowSettingsModal(true)}
          variant="outline"
          className="text-[10px] font-semibold"
        >
          <BarChart3 className="w-3.5 h-3.5 mr-2" />
          Settings
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border/40">
          <div className="text-[10px] font-semibold tracking-[2px] uppercase text-muted-foreground mb-2">
            Pending Approvals
          </div>
          <div className="text-3xl font-extralight">{pendingBookings.length}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {pendingBookings.reduce((sum, b) => sum + b.creditsRequested, 0)}c total requested
          </p>
        </Card>

        <Card className="p-4 border-border/40">
          <div className="text-[10px] font-semibold tracking-[2px] uppercase text-muted-foreground mb-2">
            Companies Enabled
          </div>
          <div className="text-3xl font-extralight">
            {companies.filter((c) => c.requireApproval).length}/{companies.length}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Requiring approval
          </p>
        </Card>

        <Card className="p-4 border-border/40">
          <div className="text-[10px] font-semibold tracking-[2px] uppercase text-muted-foreground mb-2">
            Approvals This Month
          </div>
          <div className="text-3xl font-extralight">{approvalHistory.length}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round((approvalHistory.filter((a) => a.action === "approved").length / approvalHistory.length) * 100)}% approval rate
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            <Card className="p-8 border-border/40 text-center">
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <Card key={booking.id} className="p-4 border-border/40 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{booking.resourceName}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {booking.resourceType.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                        <div>
                          <span className="font-medium">Booker:</span> {booking.bookerName} ({booking.bookerEmail})
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {booking.location}
                        </div>
                        <div>
                          <span className="font-medium">Date & Time:</span> {formatDate(booking.startTime)},{" "}
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </div>
                        <div>
                          <span className="font-medium">Requested:</span> {formatDateTime(booking.requestedAt)}
                        </div>
                      </div>

                      {booking.reason && (
                        <p className="text-xs text-muted-foreground mb-3 italic">Reason: {booking.reason}</p>
                      )}

                      {/* Budget check display */}
                      <div className={`flex items-center gap-2 text-xs p-2 rounded mb-3 ${
                        booking.creditsRequested > 20
                          ? "bg-red-500/10 border border-red-500/30"
                          : "bg-green-500/10 border border-green-500/30"
                      }`}>
                        {booking.creditsRequested > 20 ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                            <span className="text-red-600">
                              High credit request: {booking.creditsRequested}c
                            </span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-600">
                              Within budget: {booking.creditsRequested}c
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowApprovalModal(true);
                          setApprovalComment("");
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold"
                        size="sm"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowApprovalModal(true);
                          setApprovalComment("");
                        }}
                        variant="destructive"
                        size="sm"
                        className="text-[10px] font-semibold"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="space-y-3">
            {approvalHistory.map((action) => (
              <Card key={action.id} className="p-4 border-border/40">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-1.5 rounded ${
                    action.action === "approved"
                      ? "bg-green-500/10"
                      : "bg-red-500/10"
                  }`}>
                    {action.action === "approved" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {action.action === "approved" ? "Approved" : "Rejected"}
                      </span>
                      <span className="text-xs text-muted-foreground">Booking #{action.bookingId}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {action.approverName} • {formatDateTime(action.timestamp)}
                    </p>
                    {action.comment && (
                      <p className="text-xs text-muted-foreground italic bg-background/50 p-2 rounded">
                        {action.comment}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6 border-border/40">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Notification Preview</h3>
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <p className="font-medium mb-1">Pending Approvals</p>
                    You have {pendingBookings.length} booking{pendingBookings.length !== 1 ? "s" : ""} awaiting approval for a total of {pendingBookings.reduce((sum, b) => sum + b.creditsRequested, 0)} credits.
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Notification Settings</h3>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox defaultChecked />
                    <span>Email when new booking requires approval</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox defaultChecked />
                    <span>Daily summary of pending approvals</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox defaultChecked />
                    <span>Alert when high-credit booking received</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approval Workflow Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-semibold block mb-3">Company Settings</label>
              <Select
                value={selectedCompanyForSettings}
                onValueChange={setSelectedCompanyForSettings}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.companyId} value={company.companyId}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompanySettings && (
              <div className="space-y-4 p-4 bg-accent/20 rounded-lg border border-border/40">
                <div>
                  <h4 className="font-semibold text-sm mb-3">{selectedCompanySettings.companyName}</h4>
                </div>

                {/* Require approval toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Require Approval</label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enable approval workflow for all bookings from this company
                    </p>
                  </div>
                  <Checkbox
                    checked={selectedCompanySettings.requireApproval}
                    onCheckedChange={(checked) => {
                      updateCompanySettings(
                        selectedCompanySettings.companyId,
                        checked as boolean,
                        selectedCompanySettings.autoApproveThreshold
                      );
                    }}
                  />
                </div>

                {/* Auto-approval threshold */}
                {selectedCompanySettings.requireApproval && (
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Auto-Approval Threshold
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Bookings under this credit amount will be auto-approved
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={selectedCompanySettings.autoApproveThreshold}
                        onChange={(e) => {
                          updateCompanySettings(
                            selectedCompanySettings.companyId,
                            selectedCompanySettings.requireApproval,
                            parseInt(e.target.value) || 0
                          );
                        }}
                        className="w-20 px-3 py-2 border border-border rounded-lg bg-background text-sm"
                      />
                      <span className="text-sm text-muted-foreground">credits</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Changes apply immediately to new bookings. Existing pending approvals are not affected.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Booking Request</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="space-y-2 bg-background/50 p-3 rounded border border-border/40">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Resource</span>
                  <p className="font-semibold">{selectedBooking.resourceName}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Booker</span>
                  <p className="text-sm">{selectedBooking.bookerName}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Credits Requested</span>
                  <p className="text-lg font-semibold text-[#627653]">{selectedBooking.creditsRequested}c</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Decision Comment (Optional)</label>
                <Textarea
                  placeholder="Add a note for the requester..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalModal(false);
                setSelectedBooking(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectBooking}
              variant="destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleApproveBooking}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
