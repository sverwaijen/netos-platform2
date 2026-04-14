import { useState } from "react";
import { Camera, QrCode, Send, Printer, Clock, Wifi, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type CheckinStep = "scanner" | "form" | "success";

export default function GuestCheckin() {
  const [step, setStep] = useState<CheckinStep>("scanner");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    hostName: "",
  });
  const [scannedQR, setScannedQR] = useState<string | null>(null);
  const [expectedTime, setExpectedTime] = useState("09:00");
  const [actualTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );

  const handleQRScan = () => {
    toast.info("QR code scanner - placeholder for camera integration");
    setScannedQR("QR-GUEST-2024-001");
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.hostName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Check-in successful! Host notification sent.");
      setStep("success");
    } catch (error) {
      toast.error("Failed to check in. Please try again.");
    }
  };

  const handlePrintBadge = () => {
    toast.info("Print badge - placeholder for badge printer integration");
    window.print();
  };

  const handleReset = () => {
    setStep("scanner");
    setFormData({ name: "", email: "", company: "", hostName: "" });
    setScannedQR(null);
  };

  if (step === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111] px-4">
        <div className="w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#111] border border-[#627653]/20 rounded-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle2 className="h-16 w-16 mx-auto text-[#627653]" />
          </div>

          <h1 className="text-2xl font-extralight mb-2">
            Welcome, <span className="font-bold text-[#b8a472]">{formData.name}</span>
          </h1>
          <p className="text-[#627653] text-sm mb-6">Check-in successful</p>

          <div className="bg-[#0a0a0a] border border-[#627653]/10 rounded p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-1 text-[#4a7c8a]" />
              <div className="text-left text-sm">
                <p className="text-muted-foreground">Expected arrival: {expectedTime}</p>
                <p className="text-[#627653] font-medium">Actual arrival: {actualTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wifi className="h-4 w-4 mt-1 text-[#4a7c8a]" />
              <div className="text-left text-sm">
                <p className="text-muted-foreground">WiFi Network:</p>
                <p className="text-[#b8a472] font-mono text-xs">SKYNET-GUEST-2024</p>
                <p className="text-muted-foreground">Password:</p>
                <p className="text-[#b8a472] font-mono text-xs">Welcome2024!</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handlePrintBadge} className="w-full bg-[#627653] hover:bg-[#627653]/90" size="lg">
              <Printer className="h-4 w-4 mr-2" />
              Print Badge
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full" size="lg">
              Check in Another Guest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111] px-4">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#111] border border-[#627653]/20 rounded-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extralight mb-2">
            Guest <span className="font-bold text-[#b8a472]">Check-In</span>
          </h1>
          <p className="text-[#627653] text-xs font-semibold tracking-[4px] uppercase">Welcome to skynet</p>
        </div>

        {step === "scanner" ? (
          <>
            {/* QR Scanner Area */}
            <div className="bg-[#0a0a0a] border-2 border-dashed border-[#627653]/30 rounded-lg p-8 mb-6 flex flex-col items-center justify-center min-h-[240px]">
              <Camera className="h-12 w-12 text-[#627653]/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Point camera at QR code</p>
              <Button onClick={handleQRScan} size="sm" variant="outline" className="border-[#627653]">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </Button>
              {scannedQR && (
                <p className="text-xs text-[#627653] mt-4 font-mono bg-[#111] px-2 py-1 rounded">{scannedQR}</p>
              )}
            </div>

            {/* Or Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 border-t border-[#627653]/20" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Or</span>
              <div className="flex-1 border-t border-[#627653]/20" />
            </div>

            {/* Manual Form */}
            <form onSubmit={handleManualCheckin} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="bg-[#0a0a0a] border-[#627653]/20 text-foreground placeholder:text-muted-foreground/50 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="bg-[#0a0a0a] border-[#627653]/20 text-foreground placeholder:text-muted-foreground/50 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                  Company
                </Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Your Company"
                  value={formData.company}
                  onChange={handleFormChange}
                  className="bg-[#0a0a0a] border-[#627653]/20 text-foreground placeholder:text-muted-foreground/50 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="hostName" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                  Who are you visiting? *
                </Label>
                <Input
                  id="hostName"
                  name="hostName"
                  type="text"
                  placeholder="Host name or department"
                  value={formData.hostName}
                  onChange={handleFormChange}
                  className="bg-[#0a0a0a] border-[#627653]/20 text-foreground placeholder:text-muted-foreground/50 mt-1"
                />
              </div>

              {/* Time Comparison */}
              <div className="bg-[#0a0a0a] border border-[#627653]/10 rounded p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-[#4a7c8a]" />
                  <span className="text-xs font-semibold text-[#627653] uppercase tracking-wider">Arrival Times</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected:</span>
                    <Input
                      type="time"
                      value={expectedTime}
                      onChange={(e) => setExpectedTime(e.target.value)}
                      className="w-24 h-6 bg-[#111] border-[#627653]/20 text-foreground text-xs"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual:</span>
                    <span className="text-[#627653] font-mono">{actualTime}</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#627653] hover:bg-[#627653]/90 text-white font-medium"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                Complete Check-In
              </Button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
