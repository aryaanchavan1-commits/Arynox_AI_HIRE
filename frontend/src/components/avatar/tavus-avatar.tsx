"use client";

import { useState, useEffect, useCallback } from "react";
import { AIInterviewerAvatar } from "./ai-interviewer-avatar";
import { DIDAvatar } from "./did-avatar";
import { AvatarState } from "./types";
import { Video, VideoOff, Bot, Loader2, Wifi, WifiOff } from "lucide-react";

interface UnifiedAvatarProps {
  state?: AvatarState;
  audioLevel?: number;
  name?: string;
  language?: string;
  text?: string;
  context?: string;
  className?: string;
  onStateChange?: (connected: boolean) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ProviderType = "d-id" | "tavus" | "local" | "loading";

export function UnifiedAvatar({
  state = "idle",
  audioLevel = 0,
  name = "AI Interviewer",
  language = "en",
  text,
  context,
  className,
  onStateChange,
}: UnifiedAvatarProps) {
  const [provider, setProvider] = useState<ProviderType>("loading");
  const [tavusConnected, setTavusConnected] = useState(false);
  const [tavusConnecting, setTavusConnecting] = useState(false);
  const [tavusRoomUrl, setTavusRoomUrl] = useState<string | null>(null);
  const [tavusError, setTavusError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/api/avatar/status`);
        const d = await r.json();
        if (d.provider === "d-id" && d.available) {
          setProvider("d-id");
        } else if (d.provider === "tavus" && d.available) {
          setProvider("tavus");
        } else {
          setProvider("local");
        }
      } catch {
        setProvider("local");
      }
    };
    check();
  }, []);

  const startTavus = useCallback(async () => {
    setTavusConnecting(true);
    setTavusError(null);
    try {
      const r = await fetch(`${API_URL}/api/avatar/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") || "demo"}`,
        },
        body: JSON.stringify({
          conversationalContext: context || "Technical interview",
          customGreeting: "Hello! I'm your AI interviewer from ARYNOX AI HIRE.",
        }),
      });
      const d = await r.json();
      if (d.room_url) {
        setTavusRoomUrl(d.room_url);
        setTavusConnected(true);
        onStateChange?.(true);
      } else if (d.mockMode) {
        setProvider("local");
      }
    } catch (err: any) {
      setTavusError(err.message);
    } finally {
      setTavusConnecting(false);
    }
  }, [context, onStateChange]);

  // Loading
  if (provider === "loading") {
    return (
      <div className="flex h-80 w-80 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  // Tavus connected — show iframe
  if (provider === "tavus" && tavusConnected && tavusRoomUrl) {
    return (
      <div className="relative">
        <div className="h-80 w-80 overflow-hidden rounded-2xl border border-gray-200">
          <iframe src={tavusRoomUrl} className="h-full w-full border-0" allow="camera; microphone; fullscreen" title="Live Avatar" />
        </div>
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600/80 px-3 py-1 text-xs text-white backdrop-blur">
            <Wifi className="h-3 w-3" /> Live Avatar Connected
          </span>
        </div>
        <button onClick={() => { setTavusConnected(false); setTavusRoomUrl(null); }}
          className="absolute top-2 right-2 rounded-full bg-red-600/80 p-1.5 text-white hover:bg-red-700">
          <VideoOff className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // D-ID — show live video avatar
  if (provider === "d-id") {
    return (
      <div className="relative">
        <DIDAvatar state={state} audioLevel={audioLevel} text={text} language={language} />
      </div>
    );
  }

  // Tavus available but not connected — show connect button
  if (provider === "tavus" && !tavusConnected) {
    return (
      <div className="flex flex-col items-center justify-center">
        <AIInterviewerAvatar state={state} audioLevel={audioLevel} />
        <div className="mt-4">
          <button onClick={startTavus} disabled={tavusConnecting}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {tavusConnecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</> : <><Video className="h-4 w-4" /> Enable Live Avatar</>}
          </button>
          {tavusError && <p className="mt-2 text-xs text-red-500 text-center">{tavusError}</p>}
        </div>
      </div>
    );
  }

  // Local 3D fallback
  return (
    <div className={`relative ${className ?? ""}`}>
      <AIInterviewerAvatar state={state} audioLevel={audioLevel} />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          <Bot className="h-3 w-3" /> 3D Avatar Mode
        </span>
      </div>
    </div>
  );
}
