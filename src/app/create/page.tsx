"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Check, Trophy, Camera, Video, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import type { Exercise, ExerciseCategory, RecordVisibility } from "@/lib/types";

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: "Strength",
  bodyweight: "Bodyweight",
  track: "Track",
  jump: "Jump",
  throw: "Throw",
  sport: "Sport",
  other: "Other",
};

const VISIBILITY_OPTIONS: { value: RecordVisibility; label: string; desc: string }[] = [
  { value: "public", label: "Public", desc: "Anyone can see this PR" },
  { value: "friends", label: "Friends", desc: "Only people you follow" },
  { value: "private", label: "Private", desc: "Only you" },
];

function formatValue(val: string) {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

export default function CreatePage() {
  useAuthGuard();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { addToast } = useToast();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exLoading, setExLoading] = useState(true);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 10));
  const [visibility, setVisibility] = useState<RecordVisibility>("friends");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Media upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<"image" | "video" | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.exercises) setExercises(data.exercises); })
      .finally(() => setExLoading(false));
  }, []);

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => { if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl); };
  }, [mediaPreviewUrl]);

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    (acc[ex.category] ??= []).push(ex);
    return acc;
  }, {});

  const canSubmit =
    selectedExercise && value && parseFloat(value) > 0 && !submitting && !mediaUploading;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);

    const previewUrl = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreviewUrl(previewUrl);
    setUploadedMediaUrl(null);
    setUploadedMediaType(null);
    setMediaUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/records/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addToast(err.error ?? "Upload failed.", "error");
        clearMedia();
        return;
      }
      const { url, mediaType } = await res.json();
      setUploadedMediaUrl(url);
      setUploadedMediaType(mediaType);
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  }

  function clearMedia() {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setUploadedMediaUrl(null);
    setUploadedMediaType(null);
    setMediaUploading(false);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: selectedExercise.id,
          value: parseFloat(value),
          unit: selectedExercise.defaultUnit,
          notes: notes.trim() || undefined,
          mediaUrl: uploadedMediaUrl ?? undefined,
          mediaType: uploadedMediaType ?? undefined,
          recordedAt,
          visibility,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addToast(err.error ?? "Something went wrong.", "error");
        return;
      }
      setSubmitted(true);
      addToast("PR logged!", "success");
      setTimeout(() => {
        if (user?.username) router.push(`/@${user.username}`);
        else router.push("/feed");
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  }

  const isImageFile = mediaFile?.type.startsWith("image/") ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col">
        <TopBar />
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-24 md:pb-8 space-y-6">

          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">Log a PR</h1>
            <p className="text-xs text-muted mt-0.5">Record your personal best</p>
          </div>

          {/* Exercise picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Exercise</label>
            {exLoading ? (
              <div className="h-12 bg-elevated rounded-xl animate-pulse" />
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowExercisePicker((p) => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-elevated border border-border rounded-xl text-sm cursor-pointer hover:border-brand/50 transition-colors"
                >
                  <span className={selectedExercise ? "text-foreground font-medium" : "text-muted"}>
                    {selectedExercise ? selectedExercise.name : "Select an exercise…"}
                  </span>
                  <ChevronDown size={15} className={cn("text-muted transition-transform", showExercisePicker && "rotate-180")} />
                </button>
                {showExercisePicker && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-elevated border border-border rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
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
                              onClick={() => { setSelectedExercise(ex); setShowExercisePicker(false); setValue(""); }}
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
            )}
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
              Value{selectedExercise ? ` (${selectedExercise.defaultUnit})` : ""}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={selectedExercise ? `e.g. ${selectedExercise.category === "track" ? "4.4" : selectedExercise.defaultUnit === "reps" ? "10" : "225"}` : "0"}
                className="flex-1"
                min="0"
                step="any"
              />
              {selectedExercise && (
                <div className="px-3 py-2.5 bg-elevated border border-border rounded-xl text-sm text-muted min-w-14 text-center font-mono">
                  {selectedExercise.defaultUnit}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Date</label>
            <Input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border text-xs cursor-pointer transition-colors",
                    visibility === opt.value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-elevated text-muted hover:border-brand/40"
                  )}
                >
                  <span className="font-bold">{opt.label}</span>
                  <span className="text-[10px] text-center leading-tight opacity-80">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Notes <span className="font-normal normal-case">(optional)</span></label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. competition PR, paused rep, wind-assisted…"
              maxLength={500}
              rows={3}
            />
            <p className="text-[10px] text-muted text-right mt-1">{notes.length}/500</p>
          </div>

          {/* Media upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
              Proof <span className="font-normal normal-case">(optional · photo or video)</span>
            </label>

            {!mediaFile ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-7 border border-dashed border-border rounded-xl text-muted hover:border-brand/50 hover:text-foreground transition-colors cursor-pointer"
                >
                  <div className="flex gap-3">
                    <Camera size={20} />
                    <Video size={20} />
                  </div>
                  <span className="text-xs font-medium">Add photo or video</span>
                  <span className="text-[10px] opacity-60">JPG · PNG · MP4 · MOV · max 50 MB</span>
                </button>
                <p className="text-[10px] text-muted/60 mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-elevated border border-border rounded text-[9px] font-bold uppercase tracking-wider">
                    Self-reported
                  </span>
                  badge shown when no proof is attached
                </p>
              </>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-border bg-elevated">
                {isImageFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaPreviewUrl!}
                    alt="PR proof preview"
                    className="w-full max-h-72 object-contain"
                  />
                ) : (
                  <video
                    src={mediaPreviewUrl!}
                    controls
                    className="w-full max-h-72"
                    playsInline
                  />
                )}

                {/* Uploading overlay */}
                {mediaUploading && (
                  <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-brand" />
                    <span className="text-xs text-muted">Uploading…</span>
                  </div>
                )}

                {/* Remove button */}
                {!mediaUploading && (
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm rounded-full p-1.5 text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Upload done indicator */}
                {!mediaUploading && uploadedMediaUrl && (
                  <div className="absolute bottom-2 left-2 bg-surface/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                    <Check size={11} className="text-brand" />
                    <span className="text-[10px] text-brand font-bold uppercase tracking-wide">Uploaded</span>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitted}
            className="w-full"
          >
            {submitted ? (
              <><Check size={16} /> PR logged!</>
            ) : submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <><Trophy size={16} /> Log PR</>
            )}
          </Button>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
