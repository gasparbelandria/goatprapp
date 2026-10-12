"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Trophy, Plus, TrendingUp } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/cn";
import type { VerificationStatus } from "@/lib/types";

interface FeedUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  schoolName: string | null;
}

interface FeedExercise {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  direction: string;
}

interface FeedItem {
  id: string;
  value: number;
  unit: string;
  notes: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  verificationStatus: VerificationStatus;
  recordedAt: string;
  createdAt: string;
  isOwn: boolean;
  user: FeedUser;
  exercise: FeedExercise;
}

const CATEGORY_EMOJI: Record<string, string> = {
  strength: "🏋️",
  bodyweight: "💪",
  track: "🏃",
  jump: "⬆️",
  throw: "🥏",
  sport: "⚽",
  other: "🎯",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

function AvatarSmall({ displayName, avatarUrl }: { displayName: string; avatarUrl: string | null }) {
  const [err, setErr] = useState(false);
  if (avatarUrl && !err) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={36}
        height={36}
        className="rounded-full object-cover w-9 h-9 shrink-0"
        unoptimized
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center font-black text-brand text-sm shrink-0">
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}

function PRCard({ item }: { item: FeedItem }) {
  const displayVal = formatValue(item.value, item.unit);
  const emoji = CATEGORY_EMOJI[item.exercise.category] ?? "🏅";

  return (
    <div className="bg-elevated border border-border rounded-2xl overflow-hidden hover:border-brand/20 transition-colors card-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/@${item.user.username}`} className="cursor-pointer">
          <AvatarSmall displayName={item.user.displayName} avatarUrl={item.user.avatarUrl} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/@${item.user.username}`}
              className="font-black text-sm text-foreground hover:text-brand transition-colors cursor-pointer"
            >
              {item.user.displayName}
            </Link>
            {item.isOwn && (
              <span className="text-[9px] font-black uppercase tracking-widest text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted truncate">
            @{item.user.username}{item.user.schoolName ? ` · ${item.user.schoolName}` : ""}
          </p>
        </div>
        <span className="text-[10px] text-muted shrink-0">{timeAgo(item.createdAt)}</span>
      </div>

      {/* Media */}
      {item.mediaUrl && item.mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.mediaUrl}
          alt={`${item.exercise.name} PR`}
          className="w-full max-h-96 object-cover"
        />
      )}
      {item.mediaUrl && item.mediaType === "video" && (
        <video
          src={item.mediaUrl}
          controls
          playsInline
          className="w-full max-h-96 bg-background"
        />
      )}

      {/* PR content */}
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">
              {emoji} {item.exercise.name}
            </p>
            <p className="font-score text-[2.6rem] text-brand leading-none">
              {displayVal}
              <span className="text-base font-bold text-muted ml-1.5">{item.unit}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 mt-1 shrink-0">
            <div className="flex items-center gap-1 bg-brand/10 border border-brand/20 rounded-lg px-2 py-1">
              <TrendingUp size={11} className="text-brand" />
              <span className="text-[10px] font-black uppercase text-brand tracking-wide">PR</span>
            </div>
            <VerificationBadge status={item.verificationStatus} />
          </div>
        </div>

        {item.notes && (
          <p className="text-xs text-muted/80 mt-2.5 leading-relaxed italic">&ldquo;{item.notes}&rdquo;</p>
        )}

        <p className="text-[10px] text-muted mt-2">
          {new Date(item.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}

export default function FeedPage() {
  useAuthGuard();
  const { user } = useCurrentUser();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchFeed = useCallback(async (cursor?: string) => {
    const isInitial = !cursor;
    if (isInitial) setLoading(true); else setLoadingMore(true);
    try {
      const url = cursor ? `/api/feed?cursor=${encodeURIComponent(cursor)}` : "/api/feed";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) => isInitial ? (data.items ?? []) : [...prev, ...(data.items ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } finally {
      if (isInitial) setLoading(false); else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col">
        <TopBar />
        <div className="max-w-xl mx-auto w-full px-4 py-6 pb-24 md:pb-8">

          {/* Title + Log PR CTA */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide">Feed</h1>
              <p className="text-xs text-muted">Recent PRs from you and people you follow</p>
            </div>
            <Link
              href="/create"
              className="flex items-center gap-1.5 px-3 py-2 bg-brand text-background rounded-xl font-black text-xs hover:bg-brand-light transition-colors cursor-pointer shrink-0"
            >
              <Plus size={14} /> Log PR
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Trophy size={40} className="mx-auto text-muted opacity-30" />
              <div>
                <p className="font-black text-foreground mb-1">Nothing here yet</p>
                <p className="text-sm text-muted">
                  Log your first PR or follow athletes to see their PRs here.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                <Link
                  href="/create"
                  className="px-5 py-2.5 bg-brand text-background rounded-xl font-black text-sm hover:bg-brand-light transition-colors cursor-pointer"
                >
                  Log a PR
                </Link>
                {user?.username && (
                  <Link
                    href="/rankings"
                    className="px-5 py-2.5 bg-elevated border border-border text-foreground rounded-xl font-bold text-sm hover:border-brand/40 transition-colors cursor-pointer"
                  >
                    Browse Rankings
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <PRCard key={item.id} item={item} />
              ))}

              {nextCursor && (
                <button
                  onClick={() => fetchFeed(nextCursor)}
                  disabled={loadingMore}
                  className={cn(
                    "w-full py-3 rounded-xl border border-border text-sm text-muted font-bold transition-colors cursor-pointer",
                    loadingMore ? "opacity-50" : "hover:border-brand/40 hover:text-foreground"
                  )}
                >
                  {loadingMore ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Load more"}
                </button>
              )}
            </div>
          )}

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
