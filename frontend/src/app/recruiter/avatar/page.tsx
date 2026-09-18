"use client";

import { useState, useEffect, useRef } from "react";
import { AIInterviewerAvatar } from "@/components/avatar/ai-interviewer-avatar";
import { UnifiedAvatar } from "@/components/avatar/tavus-avatar";
import { AvatarState } from "@/components/avatar/types";
import {
  Bot,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";

const STATES: { label: string; value: AvatarState; icon: any; color: string }[] = [
  { label: "Idle", value: "idle", icon: Bot, color: "bg-gray-100 text-gray-700 border-gray-200" },
  { label: "Listening", value: "listening", icon: Mic, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Thinking", value: "thinking", icon: Loader2, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "Speaking", value: "speaking", icon: Volume2, color: "bg-green-50 text-green-700 border-green-200" },
  { label: "Success", value: "success", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "Error", value: "error", icon: AlertCircle, color: "bg-red-50 text-red-700 border-red-200" },
];

export default function AvatarPreviewPage() {
  const [activeState, setActiveState] = useState<AvatarState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tavusConnected, setTavusConnected] = useState(false);
  const [tavusStatus, setTavusStatus] = useState<"loading" | "available" | "unavailable">("loading");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/api/avatar/status`);
        const d = await r.json();
        setTavusStatus(d.available && !d.mockMode ? "available" : "unavailable");
      } catch {
        setTavusStatus("unavailable");
      }
    };
    check();
  }, []);

  // Simulate audio when speaking
  useEffect(() => {
    if (activeState === "speaking" && isSimulating) {
      intervalRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 100);
    } else {
      setAudioLevel(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeState, isSimulating]);

  const simulateConversation = () => {
    setIsSimulating(true);
    const sequence: AvatarState[] = ["thinking", "speaking", "listening", "thinking", "speaking", "success"];
    let i = 0;
    const advance = () => {
      if (i < sequence.length) {
        setActiveState(sequence[i]);
        i++;
        setTimeout(advance, sequence[i - 1] === "speaking" ? 3000 : 1500);
      } else {
        setActiveState("idle");
        setIsSimulating(false);
      }
    };
    advance();
  };

  return (
    <div className="min-h-screen bg-surface-950 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Avatar Preview</h1>
          <p className="mt-2 text-surface-400">
            Test and preview the AI interviewer avatar before scheduling interviews
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Avatar Preview */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-surface-900/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Live Preview</h2>
                <div className="flex items-center gap-3">
                  {tavusStatus === "available" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400 border border-green-500/20">
                      <Wifi className="h-3 w-3" />
                      Live Avatar Available
                    </span>
                  )}
                  {tavusStatus === "unavailable" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-3 py-1 text-xs text-gray-400 border border-gray-500/20">
                      <WifiOff className="h-3 w-3" />
                      3D Avatar Mode
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="rounded-2xl bg-gradient-to-b from-surface-800 to-surface-900 p-6">
                  <UnifiedAvatar
                    state={activeState}
                    audioLevel={audioLevel}
                    text={activeState === "speaking" ? "Hello! I'm your AI interviewer. Let's begin the technical interview." : undefined}
                    language="en"
                  />
                </div>
              </div>
            </div>

            {/* Simulation controls */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-surface-900/50 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Simulation Controls</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={simulateConversation}
                  disabled={isSimulating}
                  className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-all"
                >
                  {isSimulating ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Simulate Conversation
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setActiveState("idle"); setIsSimulating(false); }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-surface-700 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Controls sidebar */}
          <div className="space-y-6">
            {/* State selector */}
            <div className="rounded-2xl border border-white/10 bg-surface-900/50 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Avatar State</h3>
              <div className="space-y-2">
                {STATES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setActiveState(s.value)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        activeState === s.value
                          ? `${s.color} border-2`
                          : "border-white/10 bg-surface-800 text-surface-400 hover:bg-surface-700"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${s.value === "thinking" && activeState === "thinking" ? "animate-spin" : ""}`} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audio level */}
            <div className="rounded-2xl border border-white/10 bg-surface-900/50 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Audio Level</h3>
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(8, audioLevel * 100 * (i < 10 ? 1 : 0.7))}%`,
                      backgroundColor:
                        i / 20 < audioLevel
                          ? audioLevel > 0.7
                            ? "#ef4444"
                            : audioLevel > 0.4
                            ? "#f59e0b"
                            : "#22c55e"
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-surface-500">
                {audioLevel > 0 ? `Level: ${(audioLevel * 100).toFixed(0)}%` : "No audio input"}
              </p>
            </div>

            {/* Info */}
            <div className="rounded-2xl border border-white/10 bg-surface-900/50 p-6">
              <h3 className="text-sm font-semibold text-white mb-3">About the Avatar</h3>
              <ul className="space-y-2 text-xs text-surface-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-400 shrink-0" />
                  Realistic 3D human face with blinking
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-400 shrink-0" />
                  Mouth syncs with audio level
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-400 shrink-0" />
                  Expressive eyebrows & head movement
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-400 shrink-0" />
                  State-aware animations (idle, speaking, thinking)
                </li>
                {tavusStatus === "available" && (
                  <li className="flex items-start gap-2">
                    <Video className="h-3.5 w-3.5 mt-0.5 text-brand-400 shrink-0" />
                    Tavus live video avatar available
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
