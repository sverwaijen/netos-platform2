import { useState } from "react";
import {
  Lock,
  AlertCircle,
  CheckCircle,
  Copy,
  Globe,
  Shield,
  Zap,
  Key,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SsoProvider {
  id: string;
  name: string;
  icon: string;
  status: "connected" | "disconnected" | "error";
  enabled: boolean;
}

interface CompanySso {
  id: string;
  companyName: string;
  provider: string;
  configured: boolean;
  autoProvisioning: boolean;
  roleMapping: boolean;
}

const mockProviders: SsoProvider[] = [
  {
    id: "auth0",
    name: "Auth0",
    icon: "A0",
    status: "disconnected",
    enabled: false,
  },
  {
    id: "azure",
    name: "Azure AD",
    icon: "AZ",
    status: "disconnected",
    enabled: false,
  },
  {
    id: "google",
    name: "Google Workspace",
    icon: "GW",
    status: "disconnected",
    enabled: false,
  },
];

const mockCompanySso: CompanySso[] = [
  {
    id: "co-1",
    companyName: "Acme Corp",
    provider: "Azure AD",
    configured: true,
    autoProvisioning: true,
    roleMapping: true,
  },
  {
    id: "co-2",
    companyName: "Tech Inc",
    provider: "Google Workspace",
    configured: true,
    autoProvisioning: false,
    roleMapping: true,
  },
];

export default function SsoSettings() {
  const [providers, setProviders] = useState<SsoProvider[]>(mockProviders);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [fallbackToPassword, setFallbackToPassword] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const handleProviderToggle = (id: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId);
    setTimeout(() => {
      setTestingProvider(null);
      toast.success("Connection test successful");
    }, 1500);
  };

  const handleCopyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-8 p-1 max-w-5xl">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">
          System
        </div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          SSO<strong className="font-semibold"> Configuration.</strong>
        </h1>
      </div>

      {/* SSO Provider Cards */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-semibold tracking-[3px] uppercase text-white">
          Identity Providers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded bg-[#627653]/10 flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-[#627653]">
                    {provider.icon}
                  </span>
                </div>
                <button
                  onClick={() => handleProviderToggle(provider.id)}
                  className={`px-2 py-1 rounded text-[8px] font-semibold uppercase transition-all ${
                    provider.enabled
                      ? "bg-[#627653]/20 text-[#627653]"
                      : "bg-white/[0.05] text-[#888] hover:bg-white/[0.1]"
                  }`}
                >
                  {provider.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-white mb-1">
                  {provider.name}
                </p>
                <div className="flex items-center gap-1">
                  {provider.status === "connected" ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-[#627653]" />
                      <p className="text-[8px] text-[#627653]">Connected</p>
                    </>
                  ) : provider.status === "error" ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-[#c41e3a]" />
                      <p className="text-[8px] text-[#c41e3a]">Error</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-[#888]" />
                      <p className="text-[8px] text-[#888]">Not connected</p>
                    </>
                  )}
                </div>
              </div>

              {provider.enabled && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-white/[0.06] hover:bg-white/[0.05] text-[9px]"
                  onClick={() => handleTestConnection(provider.id)}
                  disabled={testingProvider === provider.id}
                >
                  {testingProvider === provider.id ? "Testing..." : "Test Connection"}
                </Button>
              )}

              {provider.enabled && (
                <Button
                  size="sm"
                  className="w-full bg-[#627653] text-white hover:bg-[#4a5a3f] text-[9px]"
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  Configure
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SAML 2.0 Configuration */}
      {selectedProvider && (
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-4">
          <h3 className="text-[11px] font-semibold tracking-[3px] uppercase text-white">
            SAML 2.0 Configuration
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[9px] text-[#888] font-semibold uppercase tracking-[2px]">
                Entity ID
              </label>
              <Input
                value="https://skynet.example.com/saml/entity"
                readOnly
                className="mt-1 bg-white/[0.03] border-white/[0.06]"
              />
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-[8px] h-6"
                onClick={() =>
                  handleCopyConfig("https://skynet.example.com/saml/entity")
                }
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>

            <div>
              <label className="text-[9px] text-[#888] font-semibold uppercase tracking-[2px]">
                ACS URL
              </label>
              <Input
                value="https://skynet.example.com/saml/acs"
                readOnly
                className="mt-1 bg-white/[0.03] border-white/[0.06]"
              />
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-[8px] h-6"
                onClick={() =>
                  handleCopyConfig("https://skynet.example.com/saml/acs")
                }
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>

            <div>
              <label className="text-[9px] text-[#888] font-semibold uppercase tracking-[2px]">
                IdP Certificate
              </label>
              <textarea
                placeholder="Paste your IdP certificate here"
                className="w-full mt-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded text-[9px] text-white font-mono focus:outline-none focus:border-[#627653] min-h-[100px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Per-Company SSO Configuration */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-semibold tracking-[3px] uppercase text-white">
          Company SSO Configuration
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                  Company
                </th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                  Provider
                </th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                  Status
                </th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                  Auto-Provision
                </th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                  Role Mapping
                </th>
              </tr>
            </thead>
            <tbody>
              {mockCompanySso.map((config) => (
                <tr key={config.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                  <td className="px-3 py-3 text-white">{config.companyName}</td>
                  <td className="px-3 py-3 text-white">{config.provider}</td>
                  <td className="px-3 py-3">
                    {config.configured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#627653]/10 text-[#627653] rounded text-[8px] font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#888]/10 text-[#888] rounded text-[8px] font-semibold">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {config.autoProvisioning ? (
                      <CheckCircle className="w-4 h-4 text-[#627653]" />
                    ) : (
                      <span className="text-[#888]">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {config.roleMapping ? (
                      <CheckCircle className="w-4 h-4 text-[#627653]" />
                    ) : (
                      <span className="text-[#888]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto User Provisioning */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-semibold tracking-[3px] uppercase text-white mb-1">
              Auto User Provisioning
            </h3>
            <p className="text-[9px] text-[#888]">
              Automatically create user accounts from IdP during first login
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={true}
              className="w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Fallback to Email/Password */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-semibold tracking-[3px] uppercase text-white mb-1">
              Fallback to Email/Password
            </h3>
            <p className="text-[9px] text-[#888]">
              Allow login with email and password if SSO unavailable
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fallbackToPassword}
              onChange={(e) => setFallbackToPassword(e.target.checked)}
              className="w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Role Mapping Info */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-3">
        <h3 className="text-[10px] font-semibold tracking-[3px] uppercase text-white mb-3">
          Role Mapping from IdP Groups
        </h3>
        <div className="space-y-2 text-[9px]">
          <div className="p-2 bg-white/[0.03] rounded">
            <p className="text-white mb-1">
              <span className="font-semibold">IdP Group:</span> skynet-admins
            </p>
            <p className="text-[#888]">Maps to role: Admin</p>
          </div>
          <div className="p-2 bg-white/[0.03] rounded">
            <p className="text-white mb-1">
              <span className="font-semibold">IdP Group:</span> skynet-hosts
            </p>
            <p className="text-[#888]">Maps to role: Host/Manager</p>
          </div>
          <div className="p-2 bg-white/[0.03] rounded">
            <p className="text-white mb-1">
              <span className="font-semibold">IdP Group:</span> skynet-members
            </p>
            <p className="text-[#888]">Maps to role: Member</p>
          </div>
        </div>
      </div>
    </div>
  );
}
