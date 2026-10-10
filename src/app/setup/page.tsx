"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Check, Loader2, ChevronRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { School } from "@/lib/types";

type Step = "username" | "school" | "done";

// Allowed characters: lowercase letters, digits, underscores
const ALLOWED_RE = /[^a-z0-9_]/g;

// XSS / injection indicator patterns — reject if found after sanitization passes
const DANGEROUS_RE = /[<>"'`;(){}[\]\\\/]/;

function sanitizeHandle(raw: string): string {
  return raw.toLowerCase().replace(ALLOWED_RE, "").slice(0, 20);
}

function validateHandle(h: string): string | null {
  if (h.length < 3)  return "At least 3 characters required.";
  if (h.length > 20) return "Maximum 20 characters.";
  if (DANGEROUS_RE.test(h)) return "Invalid characters detected.";
  if (!/^[a-z0-9_]{3,20}$/.test(h)) return "Only lowercase letters, numbers, and underscores.";
  if (/^_/.test(h)) return "Username cannot start with an underscore.";
  if (/^\d+$/.test(h)) return "Username cannot be entirely numeric.";
  return null;
}

export default function SetupPage() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useCurrentUser();
  const [step, setStep] = useState<Step>("username");

  // Username step state
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);

  // School step state
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSchools(q: string) {
    setSchoolsLoading(true);
    try {
      const res = await fetch(`/api/schools?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const { schools: data } = await res.json();
        setSchools(data ?? []);
      }
    } finally {
      setSchoolsLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user?.username) setStep("school");
  }, [authLoading, user]);

  // Pre-load schools when entering step 2
  useEffect(() => {
    if (step === "school") fetchSchools("");
  }, [step]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchSchools(schoolQuery);
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [schoolQuery]);

  function handleChange(raw: string) {
    const sanitized = sanitizeHandle(raw);
    setHandle(sanitized);
    setHandleError("");
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = sanitizeHandle(e.clipboardData.getData("text"));
    setHandle((prev) => sanitizeHandle(prev + pasted));
    setHandleError("");
  }

  async function claimUsername() {
    const h = handle.trim();
    const err = validateHandle(h);
    if (err) { setHandleError(err); return; }

    setHandleError("");
    setClaimLoading(true);
    try {
      const res = await fetch("/api/username/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: h }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHandleError(
          data.error === "Username taken"
            ? "That username is already taken."
            : (data.error ?? "Something went wrong.")
        );
        return;
      }
      await refresh();
      setStep("school");
    } finally {
      setClaimLoading(false);
    }
  }

  async function joinSchool() {
    if (!selectedSchool) { router.replace("/feed"); return; }
    setJoinLoading(true);
    try {
      await fetch("/api/user-schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: selectedSchool.id }),
      });
    } finally {
      router.replace("/feed");
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <Image
            src="/logo-400-400.png"
            alt="GOATPR"
            width={52}
            height={52}
            className="rounded-xl"
            priority
            unoptimized
          />
          <p className="text-xs text-muted uppercase tracking-widest font-mono">
            {step === "username" ? "Step 1 of 2 · Claim your handle" : "Step 2 of 2 · Pick your school"}
          </p>
        </div>

        {/* Step progress bar */}
        <div className="flex gap-1.5 mb-8">
          <div className="h-1 flex-1 rounded-full bg-brand" />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === "school" ? "bg-brand" : "bg-elevated"}`} />
        </div>

        {/* ── Step 1: Username ── */}
        {step === "username" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-foreground font-bold text-xl mb-1">Choose your username</h2>
              <p className="text-sm text-muted">This is your public handle on GoatPR. You can&apos;t change it later.</p>
            </div>

            <div>
              {/* Input: single unified container, no nested border */}
              <div className={`flex items-center bg-elevated border rounded-xl overflow-hidden transition-colors ${handleError ? "border-danger" : "border-border focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30"}`}>
                <span className="pl-4 pr-1 text-foreground/70 text-sm font-medium select-none flex-shrink-0">@</span>
                <input
                  value={handle}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && claimUsername()}
                  onPaste={handlePaste}
                  placeholder="yourhandle"
                  className="flex-1 bg-transparent py-3 pr-4 text-sm text-foreground placeholder:text-muted/40 focus:outline-none"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  inputMode="text"
                  maxLength={20}
                />
              </div>

              {handleError
                ? <p className="text-xs text-danger mt-1.5">{handleError}</p>
                : <p className="text-xs text-muted mt-1.5">goatpr.app/@{handle || "yourhandle"}</p>
              }
              <p className="text-[11px] text-muted/50 mt-0.5">Letters, numbers and underscores · 3–20 chars</p>
            </div>

            <Button
              onClick={claimUsername}
              disabled={claimLoading || handle.length < 3}
              className="w-full"
              size="lg"
            >
              {claimLoading
                ? <Loader2 size={16} className="animate-spin" />
                : <>Claim handle <ChevronRight size={16} /></>
              }
            </Button>
          </div>
        )}

        {/* ── Step 2: School ── */}
        {step === "school" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-foreground font-bold text-xl mb-1">Find your school</h2>
              <p className="text-sm text-muted">Compete on your school&apos;s leaderboard. You can skip this for now.</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                value={schoolQuery}
                onChange={(e) => { setSchoolQuery(e.target.value); setSelectedSchool(null); }}
                placeholder="Search your school..."
                className="w-full bg-elevated border border-border rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
                autoFocus
                autoComplete="off"
                maxLength={100}
              />
            </div>

            {/* Selected school confirmation */}
            {selectedSchool && (
              <div className="flex items-center gap-3 bg-brand/10 border border-brand/30 rounded-xl px-4 py-3">
                <Check size={15} className="text-brand shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{selectedSchool.name}</p>
                  {selectedSchool.city && (
                    <p className="text-xs text-muted">{selectedSchool.city}, {selectedSchool.state}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            )}

            {/* Schools table */}
            <div className="border border-border rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2 bg-surface border-b border-border">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">School</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">City</span>
              </div>

              {/* Table body */}
              <div className="overflow-y-auto max-h-56 feed-scroll">
                {schoolsLoading && schools.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={18} className="animate-spin text-muted" />
                  </div>
                ) : schools.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">No schools found.</p>
                ) : (
                  schools.map((s, i) => {
                    const isSelected = selectedSchool?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSchool(s)}
                        className={[
                          "w-full grid grid-cols-[1fr_auto] gap-4 items-center px-4 py-3 text-left transition-colors cursor-pointer",
                          i > 0 ? "border-t border-border" : "",
                          isSelected
                            ? "bg-brand/10"
                            : "hover:bg-elevated",
                        ].join(" ")}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          {isSelected
                            ? <Check size={13} className="text-brand shrink-0" />
                            : <span className="w-[13px] shrink-0" />
                          }
                          <span className={`text-sm font-medium truncate ${isSelected ? "text-brand" : "text-foreground"}`}>
                            {s.name}
                          </span>
                          {s.verifiedStatus === "official" && (
                            <BadgeCheck size={13} className="text-brand shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted whitespace-nowrap">
                          {s.city ?? s.state}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer count */}
              {!schoolsLoading && schools.length > 0 && (
                <div className="px-4 py-2 border-t border-border bg-surface flex items-center justify-between">
                  <span className="text-[10px] text-muted">
                    {schools.length} school{schools.length !== 1 ? "s" : ""}
                    {schoolQuery.length >= 2 ? " found" : " listed"}
                  </span>
                  {schoolsLoading && <Loader2 size={12} className="animate-spin text-muted" />}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => router.replace("/feed")}
                className="flex-1 py-3 rounded-xl border border-border text-sm text-muted hover:text-foreground hover:border-border/80 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
              <Button onClick={joinSchool} disabled={joinLoading} className="flex-1" size="md">
                {joinLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : selectedSchool ? "Join school" : "Continue"
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
