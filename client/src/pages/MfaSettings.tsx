import { useState } from "react";
import {
  Smartphone,
  Key,
  Copy,
  Check,
  RefreshCw,
  Lock,
  LockOpen,
  QrCode,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface MfaSession {
  id: string;
  device: string;
  lastUsed: string;
  mfaEnabled: boolean;
}

const mockSessions: MfaSession[] = [
  {
    id: "session-1",
    device: "Chrome on MacBook Pro",
    lastUsed: "2 minutes ago",
    mfaEnabled: true,
  },
  {
    id: "session-2",
    device: "Safari on iPhone",
    lastUsed: "1 hour ago",
    mfaEnabled: true,
  },
  {
    id: "session-3",
    device: "Firefox on Desktop",
    lastUsed: "2 days ago",
    mfaEnabled: false,
  },
];

const mockRecoveryCodes = [
  "ABCD-1234-EFGH",
  "IJKL-5678-MNOP",
  "QRST-9012-UVWX",
  "YZAB-3456-CDEF",
  "GHIJ-7890-KLMN",
  "OPQR-1234-STUV",
  "WXYZ-5678-ABCD",
  "EFGH-9012-IJKL",
  "MNOP-3456-QRST",
  "UVWX-7890-YZAB",
];

export default function MfaSettings() {
  const { roleLabel } = usePermissions();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [totpSetupStep, setTotpSetupStep] = useState<"inactive" | "setup" | "verify" | "complete">("inactive");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const isMandatory = ["admin", "host", "cfo"].includes(roleLabel?.toLowerCase() || "");

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleStartTotpSetup = () => {
    setTotpSetupStep("setup");
  };

  const handleVerifyTotp = () => {
    if (verificationCode.length === 6) {
      setTotpSetupStep("complete");
      setMfaEnabled(true);
      toast.success("TOTP enabled successfully");
      setVerificationCode("");
    }
  };

  return (
    <div className="space-y-8 p-1 max-w-4xl">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">
          Security
        </div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Multi-Factor<strong className="font-semibold"> Authentication.</strong>
        </h1>
      </div>

      {/* Mandatory MFA Warning */}
      {isMandatory && (
        <div className="p-4 bg-[#b8a472]/10 border border-[#b8a472]/20 rounded-lg">
          <p className="text-[10px] font-semibold tracking-[2px] uppercase text-[#b8a472] flex items-center gap-2">
            <Lock className="w-4 h-4" />
            MFA is mandatory for your role
          </p>
        </div>
      )}

      {/* TOTP Setup Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[12px] font-semibold tracking-[3px] uppercase text-white mb-1">
              Time-based One-Time Password
            </h3>
            <p className="text-[10px] text-[#888]">
              Use an authenticator app like Google Authenticator or Authy
            </p>
          </div>
          {!mfaEnabled && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleStartTotpSetup}
                  className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Enable TOTP
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-white/[0.06] max-w-md">
                <DialogHeader>
                  <DialogTitle>Set up TOTP</DialogTitle>
                </DialogHeader>

                {totpSetupStep === "setup" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/[0.03] rounded border border-white/[0.06]">
                      <div className="w-48 h-48 bg-white/[0.05] border border-white/[0.06] rounded flex items-center justify-center mx-auto">
                        <QrCode className="w-12 h-12 text-[#627653]" />
                      </div>
                      <p className="text-[9px] text-[#888] text-center mt-3">
                        Scan this QR code with your authenticator app
                      </p>
                    </div>
                    <div className="p-3 bg-white/[0.03] rounded border border-white/[0.06]">
                      <p className="text-[9px] text-[#888] mb-2 uppercase tracking-[2px] font-semibold">
                        Or enter code manually:
                      </p>
                      <code className="text-[10px] font-mono text-white break-all">
                        JBSWY3DP4GGUQ4D2 AAAABBBBCCCCDDDD
                      </code>
                    </div>
                    <Button
                      className="w-full bg-[#627653] text-white hover:bg-[#4a5a3f]"
                      onClick={() => setTotpSetupStep("verify")}
                    >
                      Next: Verify Code
                    </Button>
                  </div>
                )}

                {totpSetupStep === "verify" && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-[#888]">
                      Enter the 6-digit code from your authenticator app
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                      className="w-full px-3 py-2 text-center text-[14px] font-mono bg-white/[0.03] border border-white/[0.06] rounded focus:outline-none focus:border-[#627653]"
                    />
                    <Button
                      className="w-full bg-[#627653] text-white hover:bg-[#4a5a3f]"
                      onClick={handleVerifyTotp}
                      disabled={verificationCode.length !== 6}
                    >
                      Verify & Enable
                    </Button>
                  </div>
                )}

                {totpSetupStep === "complete" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#627653]/10 border border-[#627653]/20 rounded text-center">
                      <Check className="w-8 h-8 text-[#627653] mx-auto mb-2" />
                      <p className="text-[10px] font-semibold text-white">
                        TOTP Enabled Successfully
                      </p>
                    </div>
                    <p className="text-[9px] text-[#888]">
                      Your account is now protected with time-based authentication
                    </p>
                    <Button
                      className="w-full bg-[#627653] text-white hover:bg-[#4a5a3f]"
                      onClick={() => setTotpSetupStep("inactive")}
                    >
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
          {mfaEnabled && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#627653]/10 border border-[#627653]/20 rounded">
              <Check className="w-4 h-4 text-[#627653]" />
              <span className="text-[9px] font-semibold text-[#627653] uppercase">
                Enabled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SMS Fallback Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[12px] font-semibold tracking-[3px] uppercase text-white mb-1">
              SMS Backup
            </h3>
            <p className="text-[10px] text-[#888]">
              Receive verification codes via text message
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-white/[0.06] hover:bg-white/[0.05]"
          >
            <Phone className="w-4 h-4 mr-2" />
            Set Up
          </Button>
        </div>
      </div>

      {/* Recovery Codes Section */}
      {mfaEnabled && (
        <div className="space-y-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-semibold tracking-[3px] uppercase text-white mb-1">
                Recovery Codes
              </h3>
              <p className="text-[10px] text-[#888]">
                Save these codes in a safe place. Use one if you lose access to your authenticator
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-white/[0.06] hover:bg-white/[0.05]"
              onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {showRecoveryCodes ? "Hide" : "Show"}
            </Button>
          </div>

          {showRecoveryCodes && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-white/[0.03] rounded border border-white/[0.06]">
              {mockRecoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white/[0.05] rounded border border-white/[0.06]"
                >
                  <code className="text-[9px] font-mono text-white">{code}</code>
                  <button
                    onClick={() => handleCopyCode(code)}
                    className="text-[#888] hover:text-white transition-all"
                  >
                    {copiedCode === code ? (
                      <Check className="w-3 h-3 text-[#627653]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session Management */}
      <div className="space-y-4">
        <h3 className="text-[12px] font-semibold tracking-[3px] uppercase text-white">
          Active Sessions
        </h3>
        <div className="space-y-2">
          {mockSessions.map((session) => (
            <div
              key={session.id}
              className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-semibold text-white mb-1">
                  {session.device}
                </p>
                <p className="text-[9px] text-[#888]">Last used: {session.lastUsed}</p>
              </div>
              <div className="flex items-center gap-3">
                {session.mfaEnabled ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#627653]/10 border border-[#627653]/20 rounded">
                    <Lock className="w-3 h-3 text-[#627653]" />
                    <span className="text-[8px] font-semibold text-[#627653] uppercase">
                      MFA
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#c41e3a]/10 border border-[#c41e3a]/20 rounded">
                    <LockOpen className="w-3 h-3 text-[#c41e3a]" />
                    <span className="text-[8px] font-semibold text-[#c41e3a] uppercase">
                      No MFA
                    </span>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/[0.06] hover:bg-white/[0.05] h-8"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
        <p className="text-[9px] text-[#888] leading-relaxed">
          Two-factor authentication significantly increases your account security by requiring
          both your password and an authentication code to sign in. We recommend enabling this
          feature for all accounts.
        </p>
      </div>
    </div>
  );
}
