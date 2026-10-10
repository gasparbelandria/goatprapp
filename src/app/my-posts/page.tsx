"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Trash2, Trophy, Plus, TrendingUp } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/cn";
import type { ExerciseCategory } from "@/lib/types";

interface MyRecord {
  id: string;
  value: number;
  unit: string;
  notes: string | null;
  recordedAt: string;
  createdAt: string;
  visibility: string;
  exercise: {
    id: string;
    name: string;
    category: string;
    defaultUnit: string;
    direction: string;
  } | null;
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: "Strength",
  bodyweight: "Bodyweight",
  track: "Track",
  jump: "Jump",
  throw: "Throw",
  sport: "Sport",
  other: "Other",
};

function formatValue(value: number, unit: string): string {
  if (unit === "sec") {
    if (value >= 60) {
      const m = Math.floor(value / 60);
      const s = (value % 60).toFixed(2).padStart(5, "0");
      return `${m}:${s}`;
    }
    return value.toFixed(2);
  }
  return value % 1 === 0 ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function RecordRow({ record, onDelete }: { record: MyRecord; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/records/${record.id}`, { method: "DELETE" });
      if (res.ok) onDelete(record.id);
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  };

  const displayVal = formatValue(record.value, record.unit);
  const visLabel = record.visibility === "public" ? "🌐" : record.visibility === "friends" ? "👥" : "🔒";

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-elevated border border-border rounded-xl hover:border-brand/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-foreground truncate">{record.exercise?.name ?? "Unknown"}</p>
          <span className="text-[10px] text-muted" title={record.visibility}>{visLabel}</span>
        </div>
        <p className="text-xs text-muted">
          {new Date(record.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {record.notes && <span className="ml-2 opacity-70">· {record.notes.slice(0, 40)}{record.notes.length > 40 ? "…" : ""}</span>}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-black text-brand leading-none">
          {displayVal}
          <span className="text-xs font-bold text-muted ml-1">{record.unit}</span>
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={cn(
          "flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0",
          confirm ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "text-muted hover:text-red-400 hover:bg-red-500/10"
        )}
        title="Delete record"
      >
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        {confirm && !deleting && <span className="whitespace-nowrap">confirm</span>}
      </button>
    </div>
  );
}

export default function MyPRsPage() {
  useAuthGuard();
  const { user } = useCurrentUser();
  const { addToast } = useToast();

  const [records, setRecords] = useState<MyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.username) return;
    fetch(`/api/users/${user.username}/posts`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.records) setRecords(data.records);
      })
      .catch(() => addToast("Failed to load PRs", "error"))
      .finally(() => setLoading(false));
  }, [user?.username, addToast]);

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    addToast("PR deleted", "success");
  };

  // Group by exercise category
  const grouped = records.reduce<Record<string, MyRecord[]>>((acc, r) => {
    const cat = (r.exercise?.category as ExerciseCategory) ?? "other";
    (acc[cat] ??= []).push(r);
    return acc;
  }, {});

  const catOrder: ExerciseCategory[] = ["strength", "bodyweight", "track", "jump", "throw", "sport", "other"];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col">
        <TopBar />
        <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-8">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide">My PRs</h1>
              <p className="text-xs text-muted">{records.length} record{records.length !== 1 ? "s" : ""} logged</p>
            </div>
            <Link
              href="/create"
              className="flex items-center gap-1.5 px-3 py-2 bg-brand text-background rounded-xl font-black text-xs hover:bg-brand-light transition-colors cursor-pointer"
            >
              <Plus size={14} /> Log PR
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Trophy size={40} className="mx-auto text-muted opacity-30" />
              <div>
                <p className="font-black text-foreground mb-1">No PRs logged yet</p>
                <p className="text-sm text-muted">Start tracking your personal records.</p>
              </div>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-background rounded-xl font-black text-sm hover:bg-brand-light transition-colors cursor-pointer"
              >
                <TrendingUp size={16} /> Log your first PR
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {catOrder.map((cat) => {
                const catRecords = grouped[cat];
                if (!catRecords?.length) return null;
                return (
                  <div key={cat}>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">
                      {CATEGORY_LABELS[cat]} · {catRecords.length}
                    </h2>
                    <div className="space-y-2">
                      {catRecords.map((r) => (
                        <RecordRow key={r.id} record={r} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
