"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, UserPlus, UserMinus, School, MapPin, Trophy, Plus, Pencil, LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProfileBar, PublicProfileBar } from "@/components/layout/ProfileBar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/cn";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import type { GoatPRUser, PRRecord, ExerciseCategory } from "@/lib/types";

const CATEGORY_ORDER: ExerciseCategory[] = ["strength", "bodyweight", "track", "jump", "throw", "sport", "other"];
const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: "Strength",
  bodyweight: "Bodyweight",
  track: "Track",
  jump: "Jump",
  throw: "Throw",
  sport: "Sport",
  other: "Other",
};

function formatRecord(value: number, unit: string, direction: string) {
  if (unit === "sec") {
    if (value >= 60) {
      const m = Math.floor(value / 60);
      const s = (value % 60).toFixed(2).padStart(5, "0");
      return { display: `${m}:${s}`, unit: "min" };
    }
    return { display: value.toFixed(2), unit: "sec" };
  }
  const display = value % 1 === 0 ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return { display, unit };
}

function AvatarBlock({ displayName, avatarUrl, size = 64 }: { displayName: string; avatarUrl: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  const initial = displayName.charAt(0).toUpperCase();
  if (avatarUrl && !err) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        unoptimized
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-brand/20 flex items-center justify-center font-black text-brand"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  );
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const cleanUsername = username.startsWith("%40") ? username.slice(3) : username.replace(/^@/, "").toLowerCase();
  const router = useRouter();

  const { user: currentUser, loading: authLoading } = useCurrentUser();
  const isAuth = !authLoading && !!currentUser;
  const isOwnProfile = currentUser?.username === cleanUsername;

  const [profileUser, setProfileUser] = useState<GoatPRUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const [records, setRecords] = useState<PRRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setProfileLoading(true);
    setNotFoundFlag(false);
    setRecords([]);
    setRecordsLoading(true);

    Promise.all([
      fetch(`/api/users/${cleanUsername}`).then((r) => {
        if (r.status === 404) { setNotFoundFlag(true); return null; }
        return r.ok ? r.json() : null;
      }),
      fetch(`/api/follows/${cleanUsername}`).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([userData, followData]) => {
      if (userData && !userData.error) {
        setProfileUser(userData as GoatPRUser);
        setFollowersCount(userData.followersCount ?? 0);
        setFollowingCount(userData.followingCount ?? 0);
      }
      if (followData) {
        setIsFollowing(followData.isFollowing ?? false);
      }
    }).finally(() => setProfileLoading(false));

    fetch(`/api/records?username=${encodeURIComponent(cleanUsername)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.records) setRecords(data.records); })
      .finally(() => setRecordsLoading(false));
  }, [cleanUsername]);

  async function toggleFollow() {
    if (!currentUser || isOwnProfile) return;
    setFollowLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/follows/${cleanUsername}`, { method });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount((c) => isFollowing ? c - 1 : c + 1);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  if (notFoundFlag) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <p className="text-2xl font-black text-muted mb-2">404</p>
        <p className="text-sm text-muted mb-6">This profile doesn&apos;t exist.</p>
        <Link href="/feed" className="text-brand hover:text-brand-light text-sm transition-colors cursor-pointer">Back to feed</Link>
      </div>
    );
  }

  // Group records by exercise category
  const grouped = records.reduce<Record<string, PRRecord[]>>((acc, r) => {
    const cat = r.exercise.category;
    (acc[cat] ??= []).push(r);
    return acc;
  }, {});

  const profileContent = (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-8">

          {profileLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : profileUser ? (
            <>
              {/* Profile header */}
              <div className="flex items-start gap-4 mb-6">
                <AvatarBlock displayName={profileUser.displayName} avatarUrl={profileUser.avatarUrl} size={72} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-lg text-foreground leading-tight truncate">{profileUser.displayName}</p>
                  <p className="text-sm text-muted">@{profileUser.username}</p>
                  {profileUser.school && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <School size={12} className="text-muted shrink-0" />
                      <span className="text-xs text-muted truncate">{profileUser.school.name}</span>
                    </div>
                  )}
                  {profileUser.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-muted shrink-0" />
                      <span className="text-xs text-muted">{profileUser.city}, {profileUser.state ?? "MA"}</span>
                    </div>
                  )}
                </div>
                {isOwnProfile ? (
                  <Link
                    href="/profile/edit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-muted hover:text-foreground hover:border-brand/40 transition-colors cursor-pointer shrink-0"
                  >
                    <Pencil size={12} /> Edit profile
                  </Link>
                ) : currentUser ? (
                  <button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0",
                      isFollowing
                        ? "bg-elevated border border-border text-muted hover:text-foreground"
                        : "bg-brand text-background hover:bg-brand-light"
                    )}
                  >
                    {followLoading
                      ? <Loader2 size={12} className="animate-spin" />
                      : isFollowing ? <><UserMinus size={12} /> Unfollow</> : <><UserPlus size={12} /> Follow</>}
                  </button>
                ) : null}
              </div>

              {/* Stats row */}
              <div className="flex gap-6 mb-6 text-center">
                <div>
                  <p className="text-lg font-black text-foreground">{profileUser.recordCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted">PRs</p>
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{followersCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{followingCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted">Following</p>
                </div>
              </div>

              {profileUser.bio && (
                <p className="text-sm text-foreground/80 mb-6 leading-relaxed">{profileUser.bio}</p>
              )}

              {/* Log PR CTA for own profile */}
              {isOwnProfile && (
                <Link
                  href="/create"
                  className="flex items-center justify-center gap-2 w-full py-3 mb-6 bg-brand text-background rounded-xl font-bold text-sm hover:bg-brand-light transition-colors cursor-pointer"
                >
                  <Plus size={16} /> Log a PR
                </Link>
              )}

              {/* PR Records */}
              {recordsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-muted" />
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy size={32} className="mx-auto text-muted mb-3 opacity-40" />
                  <p className="text-sm text-muted">
                    {isOwnProfile ? "Log your first PR to get started." : "No public PRs yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {CATEGORY_ORDER.map((cat) => {
                    const catRecords = grouped[cat];
                    if (!catRecords?.length) return null;
                    return (
                      <div key={cat}>
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">
                          {CATEGORY_LABELS[cat]}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {catRecords.map((r) => {
                            const { display, unit } = formatRecord(r.value, r.unit, r.exercise.direction);
                            return (
                              <div
                                key={r.id}
                                className="bg-elevated border border-border rounded-2xl p-4 card-shadow"
                              >
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 truncate">
                                  {r.exercise.name}
                                </p>
                                <p className="font-score text-[2.2rem] text-brand leading-none">
                                  {display}
                                  <span className="text-sm font-bold text-muted ml-1">{unit}</span>
                                </p>
                                <div className="flex items-center justify-between mt-1.5">
                                  <p className="text-[10px] text-muted">
                                    {new Date(r.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </p>
                                  <VerificationBadge status={r.verificationStatus ?? "unverified"} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}

        </div>
  );

  if (isAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 md:ml-60 flex flex-col">
          <ProfileBar
            backHref="/feed"
            title={
              <span className="text-sm font-bold text-foreground">
                {profileLoading ? "…" : `@${cleanUsername}`}
              </span>
            }
            right={
              isOwnProfile ? (
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/");
                  }}
                  className="p-1.5 text-muted hover:text-danger transition-colors cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut size={18} strokeWidth={1.5} />
                </button>
              ) : undefined
            }
          />
          {profileContent}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicProfileBar />
      <main className="flex-1">
        {profileContent}
      </main>
      <footer className="border-t border-border py-5 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-goat.png" alt="GOATPR" width={22} height={22} className="rounded-md opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-black tracking-wide text-brand">GOATPR</span>
          <span className="text-xs text-muted">· goatpr.app</span>
        </Link>
        <p className="text-[10px] text-muted/50 mt-1">Track your personal records</p>
      </footer>
    </div>
  );
}
