"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AIInterviewerAvatar } from "./ai-interviewer-avatar";
import { AvatarState } from "./types";
import { Loader2, Video, VideoOff, Wifi, WifiOff } from "lucide-react";

interface DIDAvatarProps {
  state?: AvatarState;
  audioLevel?: number;
  text?: string;           // Text to speak
  language?: string;
  onVideoReady?: () => void;
  onVideoEnd?: () => void;
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function DIDAvatar({
  state = "idle",
  audioLevel = 0,
  text,
  language = "en",
  onVideoReady,
  onVideoEnd,
  className,
}: DIDAvatarProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevTextRef = useRef<string>("");

  // Check D-ID availability
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/api/avatar/status`);
        const d = await r.json();
        setIsAvailable(d.provider === "d-id" && d.available);
      } catch {
        setIsAvailable(false);
      }
    };
    check();
  }, []);

  // Generate video when text changes
  useEffect(() => {
    if (!isAvailable || !text || text === prevTextRef.current || state === "idle") return;
    if (state !== "speaking") return;

    prevTextRef.current = text;
    setIsGenerating(true);
    setError(null);

    const generate = async () => {
      try {
        const r = await fetch(`${API_URL}/api/avatar/talk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token") || "demo"}`,
          },
          body: JSON.stringify({ text, language }),
        });
        const data = await r.json();

        if (data.status === "done" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          onVideoReady?.();
        } else if (data.status === "mock") {
          setIsAvailable(false);
        } else {
          setError(data.error || "Failed to generate video");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [text, state, isAvailable, language, onVideoReady]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setVideoUrl(null);
    onVideoEnd?.();
  }, [onVideoEnd]);

  // Loading state
  if (isAvailable === null) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  // D-ID not available — fallback to 3D
  if (!isAvailable) {
    return (
      <div className={`relative ${className ?? ""}`}>
        <AIInterviewerAvatar state={state} audioLevel={audioLevel} />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
            <WifiOff className="h-3 w-3" />
            3D Avatar Mode
          </span>
        </div>
      </div>
    );
  }

  // D-ID available — show video or generating state
  return (
    <div className={`relative ${className ?? ""}`}>
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          playsInline
          onEnded={handleVideoEnd}
          className="h-full w-full rounded-2xl object-cover"
        />
      ) : isGenerating ? (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-surface-800 to-surface-900">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-400" />
            <p className="mt-2 text-sm text-surface-400">Generating avatar video...</p>
          </div>
        </div>
      ) : (
        <AIInterviewerAvatar state={state} audioLevel={audioLevel} />
      )}

      {/* Status badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <div className={`h-2 w-2 rounded-full ${
          videoUrl ? "bg-green-400 animate-pulse" :
          isGenerating ? "bg-amber-400 animate-pulse" :
          "bg-gray-400"
        }`} />
        <span className="text-xs text-white/80 font-medium">
          {videoUrl ? "D-ID Live" : isGenerating ? "Generating..." : "D-ID Ready"}
        </span>
      </div>

      {error && (
        <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-red-500/80 px-3 py-2 text-xs text-white backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
}
