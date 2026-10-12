"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft, Camera, Check, X, AlertCircle, LogOut } from "lucide-react";
import { SchoolPicker } from "@/components/ui/SchoolPicker";
import { cn } from "@/lib/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { School as SchoolType } from "@/lib/types";

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ALLOWED_HANDLE_RE = /[^a-z0-9_]/g;

function sanitizeHandle(raw: string): string {
  return raw.toLowerCase().replace(ALLOWED_HANDLE_RE, "").slice(0, 20);
}

type HandleStatus = "idle" | "checking" | "available" | "taken" | "reserved" | "invalid";

export default function EditProfilePage() {
  const router = useRouter();
  useAuthGuard();
  const { user, refresh } = useCurrentUser();

  const [loaded, setLoaded] = useState(false);

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Identity fields
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Profile fields
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [currentSchool, setCurrentSchool] = useState<SchoolType | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
  };

  const displayAvatarUrl = uploadedAvatarUrl ?? user?.avatarUrl ?? null;

  useEffect(() => {
    if (!user?.username) return;
    setHandle(user.username);
    setDisplayName(user.displayName ?? "");
    Promise.all([
      fetch("/api/profile/update").then((r) => r.ok ? r.json() : null),
      fetch(`/api/users/${user.username}`).then((r) => r.ok ? r.json() : null),
      fetch("/api/geo/state").then((r) => r.ok ? r.json() : null),
    ]).then(([profileData, userData, geoData]) => {
      if (profileData) {
        setBio(profileData.bio ?? "");
        setCity(profileData.city ?? "");
        setState(profileData.state ?? "");
      }
      if (userData?.school) setCurrentSchool(userData.school);
      if (geoData?.state) {
        setDetectedState(geoData.state);
        // Only auto-fill if no school and no saved state
        if (!userData?.school && !profileData?.state) {
          setState(geoData.state);
        }
      }
    }).finally(() => setLoaded(true));
  }, [user?.username, user?.displayName]);

  // Debounced availability check
  const checkAvailability = useCallback((value: string) => {
    if (checkTimeout.current) clearTimeout(checkTimeout.current);

    // Same as current — nothing to check
    if (value === user?.username) {
      setHandleStatus("idle");
      return;
    }

    if (value.length < 3) {
      setHandleStatus("idle");
      return;
    }

    setHandleStatus("checking");
    checkTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?handle=${encodeURIComponent(value)}`);
        if (!res.ok) { setHandleStatus("idle"); return; }
        const { available, reason } = await res.json();
        if (reason === "reserved") setHandleStatus("reserved");
        else if (reason === "invalid") setHandleStatus("invalid");
        else setHandleStatus(available ? "available" : "taken");
      } catch {
        setHandleStatus("idle");
      }
    }, 500);
  }, [user?.username]);

  useEffect(() => {
    return () => { if (checkTimeout.current) clearTimeout(checkTimeout.current); };
  }, []);

  function handleHandleChange(raw: string) {
    const sanitized = sanitizeHandle(raw);
    setHandle(sanitized);
    checkAvailability(sanitized);
  }

  function handleSchoolSelect(school: SchoolType | null) {
    setCurrentSchool(school);
    if (school) {
      setState(school.state);
      if (school.city) setCity(school.city);
    } else {
      setState(detectedState ?? "");
    }
  }

  const handleChanged = handle !== (user?.username ?? "");
  const handleBlocked = handleChanged && (handleStatus === "taken" || handleStatus === "reserved" || handleStatus === "invalid");
  const canSave = !saving && !handleBlocked && handleStatus !== "checking";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Please upload a JPEG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be under 5 MB.");
      e.target.value = "";
      return;
    }
    setAvatarError("");
    setAvatarUploading(true);
    setAvatarImgError(false);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUploadedAvatarUrl(data.avatarUrl);
      await refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const identityChanged = displayName.trim() !== (user?.displayName ?? "") || handleChanged;

      if (identityChanged) {
        const res = await fetch("/api/username/change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: handle, displayName: displayName.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error === "Username taken" ? "That username was just taken. Try another." : (data.error ?? "Save failed"));
          return;
        }
      }

      const profileRes = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bio.trim() || null, city: city.trim() || null, state: state.trim() || null }),
      });
      if (!profileRes.ok) {
        const d = await profileRes.json().catch(() => ({}));
        setError(d.error ?? "Save failed");
        return;
      }

      // Save school: delete existing then insert new (if selected)
      await fetch("/api/user-schools", { method: "DELETE" });
      if (currentSchool) {
        await fetch("/api/user-schools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId: currentSchool.id }),
        });
      }

      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      if (handleChanged) {
        router.replace(`/@${handle}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border px-4 h-12 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-muted hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-black uppercase tracking-widest">Edit Profile</span>
        </div>

        <div className="max-w-lg mx-auto w-full px-4 py-6 pb-24 md:pb-8">
          <button
            onClick={() => router.back()}
            className="hidden md:inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="text-2xl font-black tracking-tight text-foreground mb-1">Edit Profile</h1>
          <p className="text-sm text-muted mb-6">Update your name, username, bio, and photo.</p>

          {error && (
            <div className="flex items-center gap-2 text-xs text-danger font-bold mb-4 p-3 bg-danger/10 rounded-xl border border-danger/20">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Avatar */}
          <div className="bg-elevated border border-border rounded-2xl p-6 mb-4 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="size-24 rounded-full overflow-hidden bg-brand/20 border border-border flex items-center justify-center">
                {displayAvatarUrl && !avatarImgError ? (
                  <Image
                    src={displayAvatarUrl}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={() => setAvatarImgError(true)}
                  />
                ) : (
                  <span className="text-2xl font-black text-brand">
                    {(user?.displayName ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 bg-brand rounded-full p-1.5 text-background hover:bg-brand-light transition-colors cursor-pointer"
              >
                {avatarUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            {avatarError && <p className="text-xs text-danger text-center">{avatarError}</p>}
            <p className="text-xs text-muted">JPEG, PNG or WebP · max 5 MB</p>
          </div>

          {/* Identity */}
          <div className="bg-elevated border border-border rounded-2xl p-5 mb-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
              />
              <p className="text-[10px] text-muted text-right mt-1">{displayName.length}/50</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Username</label>
              <div className={cn(
                "flex items-center bg-surface border rounded-xl overflow-hidden transition-colors",
                handleStatus === "available" ? "border-brand-light focus-within:border-brand-light" :
                handleBlocked ? "border-danger" :
                "border-border focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30"
              )}>
                <span className="pl-4 pr-1 text-foreground/70 text-sm font-medium select-none flex-shrink-0">@</span>
                <input
                  value={handle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  placeholder="yourhandle"
                  className="flex-1 bg-transparent py-3 pr-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={20}
                />
                <div className="pr-3 flex-shrink-0">
                  {handleStatus === "checking" && <Loader2 size={14} className="animate-spin text-muted" />}
                  {handleStatus === "available" && <Check size={14} className="text-brand-light" />}
                  {(handleStatus === "taken" || handleStatus === "reserved") && <X size={14} className="text-danger" />}
                </div>
              </div>

              {handleStatus === "available" && (
                <p className="text-xs text-brand-light mt-1.5 flex items-center gap-1">
                  <Check size={11} /> @{handle} is available
                </p>
              )}
              {handleStatus === "taken" && (
                <p className="text-xs text-danger mt-1.5">@{handle} is already taken.</p>
              )}
              {handleStatus === "reserved" && (
                <p className="text-xs text-danger mt-1.5">That username is reserved.</p>
              )}
              {handleStatus === "invalid" && (
                <p className="text-xs text-danger mt-1.5">Only lowercase letters, numbers and underscores · 3–20 chars.</p>
              )}
              {handleStatus === "idle" && (
                <p className="text-[10px] text-muted/50 mt-1">goatpr.app/@{handle || "yourhandle"}</p>
              )}
            </div>
          </div>

          {/* Profile fields */}
          <div className="bg-elevated border border-border rounded-2xl p-5 mb-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people what you train for…"
                maxLength={160}
                rows={3}
              />
              <p className="text-[10px] text-muted text-right mt-1">{bio.length}/160</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">City</label>
              {currentSchool?.city ? (
                <div className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted flex items-center justify-between">
                  <span>{currentSchool.city}</span>
                  <span className="text-[10px] text-muted/50">Derived from school</span>
                </div>
              ) : (
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Boston"
                  maxLength={100}
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">State</label>
              {currentSchool ? (
                <div className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted flex items-center justify-between">
                  <span>{currentSchool.state}</span>
                  <span className="text-[10px] text-muted/50">Derived from school</span>
                </div>
              ) : (
                <>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="e.g. MA"
                    maxLength={2}
                  />
                  {detectedState && state === detectedState && (
                    <p className="text-[10px] text-muted/50 mt-1">Auto-detected from your IP</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* School */}
          <div className="bg-elevated border border-border rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">School</p>
            <SchoolPicker selected={currentSchool} onSelect={handleSchoolSelect} />
          </div>

          <Button onClick={handleSave} disabled={!canSave || saved} className="w-full">
            {saved ? (
              <><CheckCircle2 size={16} /> Saved</>
            ) : saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Save changes"
            )}
          </Button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:text-danger hover:border-danger/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
            Log out
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
