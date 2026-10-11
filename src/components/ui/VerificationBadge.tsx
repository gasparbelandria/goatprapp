import { Pencil, Video, Trophy } from "lucide-react";
import type { VerificationStatus } from "@/lib/types";

const CONFIG: Record<VerificationStatus, {
  icon: React.ElementType;
  label: string;
  iconBg: string;
  textColor: string;
}> = {
  unverified: {
    icon: Pencil,
    label: "Self-reported",
    iconBg: "bg-surface border border-border",
    textColor: "text-muted",
  },
  verified: {
    icon: Video,
    label: "Video verified",
    iconBg: "bg-blue-600/20 border border-blue-500/30",
    textColor: "text-blue-400",
  },
  official: {
    icon: Trophy,
    label: "Official",
    iconBg: "bg-brand/20 border border-brand/30",
    textColor: "text-brand",
  },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { icon: Icon, label, iconBg, textColor } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${textColor}`}>
      <span className={`inline-flex items-center justify-center size-4 rounded ${iconBg}`}>
        <Icon size={9} className={textColor} />
      </span>
      {label}
    </span>
  );
}
