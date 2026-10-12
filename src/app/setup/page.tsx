"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SchoolPicker } from "@/components/ui/SchoolPicker";
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
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.username) setStep("school");
  }, [authLoading, user]);

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
            src="/logo-goat.png"
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

            <SchoolPicker selected={selectedSchool} onSelect={setSelectedSchool} autoFocus />

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
