import { Pencil, Video, Trophy } from "lucide-react";
import type { VerificationStatus } from "@/lib/types";

const CONFIG: Record<VerificationStatus, {
  icon: React.ElementType;
  label: string;
}> = {
  unverified: { icon: Pencil,  label: "Self-reported" },
  verified:   { icon: Video,   label: "Video verified" },
  official:   { icon: Trophy,  label: "Official" },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { icon: Icon, label } = CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted">
      <span className="inline-flex items-center justify-center size-4 rounded border border-border bg-surface">
        <Icon size={9} className="text-muted" />
      </span>
      {label}
    </span>
  );
}
