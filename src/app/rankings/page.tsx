"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Trophy, Loader2, ChevronDown, Search } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/cn";
import type { Exercise, PRRankingEntry, School, ExerciseCategory } from "@/lib/types";

type Scope = "SCHOOL" | "STATE" | "FRIENDS";
const SCOPES: Scope[] = ["SCHOOL", "STATE", "FRIENDS"];
const SCOPE_LABELS: Record<Scope, string> = { SCHOOL: "School", STATE: "State", FRIENDS: "Friends" };

const CATEGORY_ORDER: ExerciseCategory[] = ["strength", "bodyweight", "track", "jump", "throw", "sport", "other"];
const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: "Strength", bodyweight: "Bodyweight", track: "Track",
  jump: "Jump", throw: "Throw", sport: "Sport", other: "Other",
};

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function formatValue(value: number, unit: string) {
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

function AvatarSmall({ displayName, avatarUrl }: { displayName: string; avatarUrl: string | null }) {
  const [err, setErr] = useState(false);
  if (avatarUrl && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        className="w-8 h-8 rounded-full object-cover shrink-0"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center font-black text-brand text-xs shrink-0">
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}

function RankRow({ entry, currentUsername, unit }: { entry: PRRankingEntry; currentUsername?: string | null; unit: string }) {
  const isMe = entry.username === currentUsername;
  return (
    <Link
      href={`/@${entry.username}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer",
        isMe ? "bg-brand/10 border-brand/30 hover:bg-brand/15" : "bg-elevated border-border hover:border-brand/20"
      )}
    >
      <div className="w-7 shrink-0 text-center">
        {MEDAL[entry.rank] ? (
          <span className="text-base leading-none">{MEDAL[entry.rank]}</span>
        ) : (
          <span className={cn("text-xs font-black tabular-nums", isMe ? "text-brand" : "text-muted")}>
            {entry.rank}
          </span>
        )}
      </div>
      <AvatarSmall displayName={entry.displayName} avatarUrl={entry.avatarUrl} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-black text-sm leading-tight truncate", isMe ? "text-brand" : "text-foreground")}>
          {entry.displayName}
        </p>
        <p className="text-[10px] text-muted truncate">
          @{entry.username}{entry.school ? ` · ${entry.school.name}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-black text-sm text-foreground tabular-nums">
          {formatValue(entry.bestValue, unit)}
          <span className="text-xs font-bold text-muted ml-1">{unit}</span>
        </p>
        <p className="text-[10px] text-muted">
          {new Date(entry.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
    </Link>
  );
}

export default function RankingsPage() {
  useAuthGuard();
  const { user } = useCurrentUser();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExPicker, setShowExPicker] = useState(false);

  const [scope, setScope] = useState<Scope>("SCHOOL");

  // School picker state (for SCHOOL scope)
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolResults, setSchoolResults] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const schoolDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rankings, setRankings] = useState<PRRankingEntry[]>([]);
  const [rankExercise, setRankExercise] = useState<{ name: string; defaultUnit: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load exercises on mount
  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.exercises?.length) {
          setExercises(data.exercises);
          setSelectedExercise(data.exercises[0]);
        }
      });
  }, []);

  // School search
  useEffect(() => {
    if (schoolDebounce.current) clearTimeout(schoolDebounce.current);
    if (schoolQuery.length < 2) { setSchoolResults([]); return; }
    schoolDebounce.current = setTimeout(async () => {
      setSchoolsLoading(true);
      try {
        const res = await fetch(`/api/schools?q=${encodeURIComponent(schoolQuery)}`);
        if (res.ok) {
          const { schools } = await res.json();
          setSchoolResults(schools ?? []);
        }
      } finally {
        setSchoolsLoading(false);
      }
    }, 300);
    return () => { if (schoolDebounce.current) clearTimeout(schoolDebounce.current); };
  }, [schoolQuery]);

  // Fetch rankings when params change
  useEffect(() => {
    if (!selectedExercise) return;
    if (scope === "SCHOOL" && !selectedSchool) return;

    const params = new URLSearchParams({ exerciseId: selectedExercise.id, scope: scope.toLowerCase() });
    if (scope === "SCHOOL" && selectedSchool) params.set("schoolId", selectedSchool.id);

    setLoading(true);
    setRankings([]);
    fetch(`/api/rankings?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setRankings(data.rankings ?? []);
          setRankExercise(data.exercise ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedExercise, scope, selectedSchool]);

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    (acc[ex.category] ??= []).push(ex);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col">
        <TopBar />
        <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-8 space-y-5">

          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">Rankings</h1>
            <p className="text-xs text-muted mt-0.5">Best personal records by exercise</p>
          </div>

          {/* Exercise picker */}
          <div className="relative">
            <button
              onClick={() => setShowExPicker((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-elevated border border-border rounded-xl text-sm cursor-pointer hover:border-brand/50 transition-colors"
            >
              <span className={selectedExercise ? "text-foreground font-medium" : "text-muted"}>
                {selectedExercise ? selectedExercise.name : "Select exercise…"}
              </span>
              <ChevronDown size={15} className={cn("text-muted transition-transform", showExPicker && "rotate-180")} />
            </button>
            {showExPicker && (
              <div className="absolute z-20 top-full mt-1 w-full bg-elevated border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                {(Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).map((cat) => {
                  const list = grouped[cat];
                  if (!list?.length) return null;
                  return (
                    <div key={cat}>
                      <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted bg-surface/50 sticky top-0">
                        {CATEGORY_LABELS[cat]}
                      </p>
                      {list.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => { setSelectedExercise(ex); setShowExPicker(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface cursor-pointer transition-colors"
                        >
                          <span className={selectedExercise?.id === ex.id ? "text-brand font-medium" : "text-foreground"}>
                            {ex.name}
                          </span>
                          <span className="text-xs text-muted">{ex.defaultUnit}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scope tabs */}
          <div className="flex border-b border-border">
            {SCOPES.map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  "flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-b-2 cursor-pointer",
                  scope === s ? "text-foreground border-brand" : "text-muted border-transparent hover:text-foreground"
                )}
              >
                {SCOPE_LABELS[s]}
              </button>
            ))}
          </div>

          {/* School search (only for SCHOOL scope) */}
          {scope === "SCHOOL" && (
            <div className="space-y-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <Input
                  value={schoolQuery}
                  onChange={(e) => { setSchoolQuery(e.target.value); setSelectedSchool(null); }}
                  placeholder="Search your school…"
                  className="pl-9"
                />
              </div>
              {schoolsLoading && (
                <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-muted" /></div>
              )}
              {schoolResults.length > 0 && !selectedSchool && (
                <div className="bg-elevated border border-border rounded-xl overflow-hidden">
                  {schoolResults.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSchool(s); setSchoolQuery(s.name); setSchoolResults([]); }}
                      className={cn("w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-surface transition-colors cursor-pointer text-sm", i > 0 && "border-t border-border")}
                    >
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        {s.city && <p className="text-xs text-muted">{s.city}, {s.state}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedSchool && (
                <p className="text-xs text-muted">
                  Showing <span className="text-foreground font-bold">{selectedSchool.name}</span>
                  <button onClick={() => { setSelectedSchool(null); setSchoolQuery(""); }} className="ml-2 text-brand hover:text-brand-light cursor-pointer">change</button>
                </p>
              )}
            </div>
          )}

          {/* Rankings list */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : scope === "SCHOOL" && !selectedSchool ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted">Select a school to see rankings.</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-12">
              <Trophy size={32} className="mx-auto text-muted mb-3 opacity-40" />
              <p className="text-sm text-muted">
                {scope === "FRIENDS" ? "Follow people to see friends rankings." : "No public PRs logged yet."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedExercise && (
                <p className="text-xs text-muted uppercase tracking-widest font-bold mb-1">
                  {selectedExercise.name} · {SCOPE_LABELS[scope]}{selectedSchool ? ` · ${selectedSchool.name}` : ""}
                </p>
              )}
              {rankings.map((entry) => (
                <RankRow
                  key={entry.username}
                  entry={entry}
                  currentUsername={user?.username}
                  unit={rankExercise?.defaultUnit ?? selectedExercise?.defaultUnit ?? ""}
                />
              ))}
            </div>
          )}

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
