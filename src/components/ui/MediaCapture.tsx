"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, Video, Square } from "lucide-react";

const MAX_SECONDS = 10;

interface MediaCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function MediaCapture({ open, onClose, onCapture }: MediaCaptureProps) {
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(MAX_SECONDS);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setRecording(false);
      setCountdown(MAX_SECONDS);
      setError(null);
      return;
    }

    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setError("Camera access denied. Please allow camera permissions and try again.");
      });

    return () => stopStream();
  }, [open, stopStream]);

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
        onClose();
      },
      "image/jpeg",
      0.92
    );
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      const preferred = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
      recorder = new MediaRecorder(stream, { mimeType: preferred });
    } catch {
      try { recorder = new MediaRecorder(stream, { mimeType: "video/webm" }); }
      catch { recorder = new MediaRecorder(stream); }
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      // Strip codec suffix (e.g. "video/webm; codecs=vp8") → "video/webm"
      const rawMime = recorder.mimeType || "video/webm";
      const cleanMime = rawMime.split(";")[0].trim();
      const ext = cleanMime === "video/mp4" ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: cleanMime });
      onCapture(new File([blob], `capture.${ext}`, { type: cleanMime }));
      onClose();
    };

    recorder.start(100);
    setRecording(true);
    setCountdown(MAX_SECONDS);

    let remaining = MAX_SECONDS;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) stopRecording();
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }

  if (!open) return null;

  const progress = ((MAX_SECONDS - countdown) / MAX_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2">
        <button
          onClick={() => { stopRecording(); onClose(); }}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={22} />
        </button>
        <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
          {mode === "photo" ? "Photo" : recording ? `${countdown}s` : "Video · 10s max"}
        </span>
        <div className="w-10" />
      </div>

      {/* Camera preview */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
            <p className="text-white/70 text-sm leading-relaxed">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* Recording progress bar */}
        {recording && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-red-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="pb-safe pb-10 pt-6 flex flex-col items-center gap-5">
        {/* Mode tabs */}
        {!recording && (
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
            <button
              onClick={() => setMode("photo")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                mode === "photo" ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              <Camera size={13} /> Photo
            </button>
            <button
              onClick={() => setMode("video")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                mode === "video" ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              <Video size={13} /> Video
            </button>
          </div>
        )}

        {/* Capture button */}
        {!error && (
          <button
            onClick={
              mode === "photo"
                ? capturePhoto
                : recording
                ? stopRecording
                : startRecording
            }
            className="cursor-pointer transition-transform active:scale-90"
            aria-label={mode === "photo" ? "Take photo" : recording ? "Stop recording" : "Start recording"}
          >
            {mode === "photo" ? (
              /* White ring + white fill */
              <div className="size-18 rounded-full border-4 border-white flex items-center justify-center">
                <div className="size-14 rounded-full bg-white" />
              </div>
            ) : recording ? (
              /* Red ring + red square (stop) */
              <div className="size-18 rounded-full border-4 border-red-500 flex items-center justify-center">
                <Square size={24} className="text-red-500 fill-red-500" />
              </div>
            ) : (
              /* White ring + red fill (record) */
              <div className="size-18 rounded-full border-4 border-white flex items-center justify-center">
                <div className="size-14 rounded-full bg-red-500" />
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
