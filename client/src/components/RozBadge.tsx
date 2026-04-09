import { ShieldCheck } from "lucide-react";

interface RozBadgeProps {
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
}

export default function RozBadge({ onClick, size = "sm", className = "" }: RozBadgeProps) {
  const sizeClasses = size === "sm"
    ? "text-[9px] px-1.5 py-0.5 gap-0.5"
    : "text-xs px-2 py-1 gap-1";

  const iconSize = size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`inline-flex items-center ${sizeClasses} rounded-md font-semibold tracking-wide uppercase
        bg-amber-500/15 text-amber-500 border border-amber-500/30
        hover:bg-amber-500/25 hover:border-amber-500/50 transition-all cursor-pointer
        ${className}`}
      title="ROZ Huurovereenkomst — Klik voor meer info"
    >
      <ShieldCheck className={iconSize} />
      ROZ
    </button>
  );
}
