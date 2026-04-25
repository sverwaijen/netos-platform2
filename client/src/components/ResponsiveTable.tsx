import React from "react";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

/**
 * ResponsiveTable: renders as a standard table on desktop (md+),
 * switches to stacked card layout on mobile.
 */
export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  emptyMessage = "No data",
  onRowClick,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-[10px] font-semibold tracking-wider uppercase text-muted-foreground py-2 px-3"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item[keyField]}
                className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-2.5 px-3 text-xs">
                    {col.render ? col.render(item) : String(item[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-2">
        {data.map((item) => (
          <div
            key={item[keyField]}
            className={`border border-white/[0.06] rounded-lg p-3 space-y-1.5 hover:bg-white/[0.02] transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
            onClick={() => onRowClick?.(item)}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div key={col.key} className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
                    {col.label}
                  </span>
                  <span className="text-xs text-right">
                    {col.render ? col.render(item) : String(item[col.key] ?? "")}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
