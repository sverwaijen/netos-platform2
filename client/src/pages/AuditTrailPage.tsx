import { useState } from "react";
import { Download, Search, Filter, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT";
  entity: string;
  entityId: string;
  details: string;
  severity: "low" | "medium" | "high";
  ipAddress: string;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    timestamp: "2026-04-14 14:32:15",
    user: "John Doe",
    userEmail: "john@example.com",
    action: "LOGIN",
    entity: "User Session",
    entityId: "session-001",
    details: "Successful login from Chrome on MacBook",
    severity: "low",
    ipAddress: "192.168.1.100",
  },
  {
    id: "log-2",
    timestamp: "2026-04-14 14:15:22",
    user: "Jane Smith",
    userEmail: "jane@example.com",
    action: "CREATE",
    entity: "Booking",
    entityId: "booking-5012",
    details: "Created meeting room booking for Apr 15",
    severity: "low",
    ipAddress: "192.168.1.105",
  },
  {
    id: "log-3",
    timestamp: "2026-04-14 13:45:10",
    user: "Admin User",
    userEmail: "admin@example.com",
    action: "DELETE",
    entity: "User Account",
    entityId: "user-234",
    details: "Deleted inactive account",
    severity: "high",
    ipAddress: "10.0.0.50",
  },
  {
    id: "log-4",
    timestamp: "2026-04-14 13:20:05",
    user: "CFO User",
    userEmail: "cfo@example.com",
    action: "EXPORT",
    entity: "Financial Report",
    entityId: "report-2024-q1",
    details: "Exported quarterly financial data",
    severity: "high",
    ipAddress: "192.168.1.200",
  },
  {
    id: "log-5",
    timestamp: "2026-04-14 12:55:33",
    user: "John Doe",
    userEmail: "john@example.com",
    action: "UPDATE",
    entity: "Company Profile",
    entityId: "company-456",
    details: "Updated company contact information",
    severity: "medium",
    ipAddress: "192.168.1.100",
  },
];

const actionColors = {
  CREATE: "text-[#627653]",
  UPDATE: "text-[#b8a472]",
  DELETE: "text-[#c41e3a]",
  LOGIN: "text-[#4a7c8a]",
  EXPORT: "text-[#c41e3a]",
};

const severityColors = {
  low: "bg-[#627653]/10 text-[#627653]",
  medium: "bg-[#b8a472]/10 text-[#b8a472]",
  high: "bg-[#c41e3a]/10 text-[#c41e3a]",
};

export default function AuditTrailPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<string>("");
  const [showGdprLog, setShowGdprLog] = useState(false);

  const filteredLogs = mockAuditLogs.filter((log) => {
    if (
      searchQuery &&
      !log.user.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.details.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (filterAction && log.action !== filterAction) {
      return false;
    }
    return true;
  });

  const handleExportCsv = () => {
    const csv = [
      ["Timestamp", "User", "Email", "Action", "Entity", "Details", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.user,
          log.userEmail,
          log.action,
          log.entity,
          `"${log.details}"`,
          log.ipAddress,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 p-1 max-w-6xl">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">
          System
        </div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Audit<strong className="font-semibold"> Trail.</strong>
        </h1>
      </div>

      {/* Retention Policy */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
        <p className="text-[9px] font-semibold tracking-[2px] uppercase text-[#627653] mb-2">
          Retention Policy
        </p>
        <p className="text-[10px] text-[#888]">
          Audit logs are retained for 7 years for financial and compliance purposes. All sensitive
          operations are logged including user access, data modifications, and exports.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by user, email, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.03] border-white/[0.06]"
            />
          </div>

          <select
            value={filterAction || ""}
            onChange={(e) => setFilterAction(e.target.value || null)}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] text-white focus:outline-none focus:border-[#627653]"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="EXPORT">Export</option>
          </select>

          <input
            type="date"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] text-white focus:outline-none focus:border-[#627653]"
          />

          <Button
            onClick={handleExportCsv}
            className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                Timestamp
              </th>
              <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                User
              </th>
              <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                Action
              </th>
              <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                Entity
              </th>
              <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                Details
              </th>
              <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                Severity
              </th>
              <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-all">
                <td className="px-3 py-3 text-white">{log.timestamp}</td>
                <td className="px-3 py-3">
                  <div>
                    <p className="text-white">{log.user}</p>
                    <p className="text-[#888]">{log.userEmail}</p>
                  </div>
                </td>
                <td className={`px-3 py-3 font-semibold ${actionColors[log.action]}`}>
                  {log.action}
                </td>
                <td className="px-3 py-3 text-white">{log.entity}</td>
                <td className="px-3 py-3 text-[#888]">{log.details}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-[8px] font-semibold uppercase ${
                      severityColors[log.severity]
                    }`}
                  >
                    {log.severity}
                  </span>
                </td>
                <td className="px-3 py-3 text-[#888] font-mono text-[8px]">
                  {log.ipAddress}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results summary */}
      <div className="text-[9px] text-[#888]">
        Showing {filteredLogs.length} of {mockAuditLogs.length} audit logs
      </div>

      {/* GDPR Data Deletion Log */}
      <div className="space-y-4">
        <button
          onClick={() => setShowGdprLog(!showGdprLog)}
          className="flex items-center gap-2 text-[10px] font-semibold tracking-[2px] uppercase text-[#627653] hover:text-white transition-all"
        >
          {showGdprLog ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          GDPR Data Deletion Log
        </button>

        {showGdprLog && (
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-3">
            {[
              {
                date: "2026-04-10",
                user: "user@example.com",
                reason: "User requested GDPR deletion",
              },
              {
                date: "2026-04-05",
                user: "inactive-user@example.com",
                reason: "Account inactive for 2 years - auto-deletion",
              },
            ].map((record, idx) => (
              <div
                key={idx}
                className="p-2 bg-white/[0.03] rounded border border-white/[0.06]"
              >
                <p className="text-[9px] text-white mb-1">
                  <span className="font-semibold">{record.date}</span> - {record.user}
                </p>
                <p className="text-[8px] text-[#888]">{record.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
