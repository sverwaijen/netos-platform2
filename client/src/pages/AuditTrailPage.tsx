import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Download, Search, Eye, EyeOff, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const actionColors: Record<string, string> = {
  CREATE: "text-[#627653]",
  UPDATE: "text-[#b8a472]",
  DELETE: "text-[#c41e3a]",
  LOGIN: "text-[#4a7c8a]",
  LOGOUT: "text-[#4a7c8a]",
  EXPORT: "text-[#c41e3a]",
  VIEW: "text-[#888]",
  SETTINGS_CHANGE: "text-[#b8a472]",
};

const severityColors: Record<string, string> = {
  low: "bg-[#627653]/10 text-[#627653]",
  medium: "bg-[#b8a472]/10 text-[#b8a472]",
  high: "bg-[#c41e3a]/10 text-[#c41e3a]",
};

const PAGE_SIZE = 50;

export default function AuditTrailPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showGdprLog, setShowGdprLog] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, refetch } = trpc.audit.list.useQuery({
    search: searchQuery || undefined,
    action: (filterAction || undefined) as any,
    severity: (filterSeverity || undefined) as any,
    fromDate: filterDateFrom || undefined,
    toDate: filterDateTo || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExportCsv = () => {
    const csv = [
      ["Timestamp", "User", "Email", "Action", "Entity", "Entity ID", "Details", "Severity", "IP Address"].join(","),
      ...logs.map((log: any) =>
        [
          log.timestamp ? new Date(log.timestamp).toISOString() : "",
          log.userName || "",
          log.userEmail || "",
          log.action,
          log.entity,
          log.entityId || "",
          `"${(log.details || "").replace(/"/g, '""')}"`,
          log.severity,
          log.ipAddress || "",
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
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">
            System
          </div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Audit<strong className="font-semibold"> Trail.</strong>
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-[#627653] border-[#627653]/30"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
              placeholder="Search by user, email, entity, or details..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="bg-white/[0.03] border-white/[0.06]"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] text-white focus:outline-none focus:border-[#627653]"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="EXPORT">Export</option>
            <option value="VIEW">View</option>
            <option value="SETTINGS_CHANGE">Settings Change</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] text-white focus:outline-none focus:border-[#627653]"
          >
            <option value="">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] text-white focus:outline-none focus:border-[#627653]"
            placeholder="From"
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] text-white focus:outline-none focus:border-[#627653]"
            placeholder="To"
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
        {isLoading ? (
          <div className="text-center py-12 text-[#888] text-sm">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-[#888] text-sm">
            No audit logs found. Actions like logins, bookings, and settings changes will appear here.
          </div>
        ) : (
          <table className="w-full text-[9px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">Timestamp</th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">User</th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">Action</th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">Entity</th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">Details</th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">Severity</th>
                <th className="text-left px-3 py-2 font-semibold tracking-[2px] uppercase text-[#627653]">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-all">
                  <td className="px-3 py-3 text-white whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div>
                      <p className="text-white">{log.userName || "System"}</p>
                      <p className="text-[#888]">{log.userEmail || "—"}</p>
                    </div>
                  </td>
                  <td className={`px-3 py-3 font-semibold ${actionColors[log.action] || "text-white"}`}>
                    {log.action}
                  </td>
                  <td className="px-3 py-3 text-white">
                    {log.entity}
                    {log.entityId && <span className="text-[#888] ml-1">#{log.entityId}</span>}
                  </td>
                  <td className="px-3 py-3 text-[#888] max-w-[300px] truncate">{log.details || "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-[8px] font-semibold uppercase ${severityColors[log.severity] || ""}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[#888] font-mono text-[8px]">
                    {log.ipAddress || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[9px] text-[#888]">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} audit logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-[#627653] border-[#627653]/30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-[10px] text-[#888]">Page {page + 1} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="text-[#627653] border-[#627653]/30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Results summary (single page) */}
      {totalPages <= 1 && (
        <div className="text-[9px] text-[#888]">
          Showing {logs.length} of {total} audit logs
        </div>
      )}

      {/* GDPR Data Deletion Log */}
      <div className="space-y-4">
        <button
          onClick={() => setShowGdprLog(!showGdprLog)}
          className="flex items-center gap-2 text-[10px] font-semibold tracking-[2px] uppercase text-[#627653] hover:text-white transition-all"
        >
          {showGdprLog ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          GDPR Data Deletion Log
        </button>

        {showGdprLog && (
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-3">
            <p className="text-[9px] text-[#888]">
              GDPR deletion requests are tracked separately. Contact the data protection officer for access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
