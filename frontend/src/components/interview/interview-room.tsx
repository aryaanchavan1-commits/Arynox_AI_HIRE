"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare,
  Clock, Send, Bot, User, Maximize, Minimize,
  Monitor, AlertTriangle, ShieldCheck, ShieldAlert, Sparkles,
} from "lucide-react";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import { useVAD } from "@/hooks/use-vad";
import { useInterviewSession } from "@/hooks/use-interview-session";
import { useScreenCapture } from "@/hooks/use-screen-capture";
import { useProctoring } from "@/hooks/use-proctoring";
import { API_URL } from "@/lib/utils";

interface InterviewRoomProps {
  interviewId: string;
  candidateId: string;
  invitationToken: string;
  jobTitle: string;
  language: "en" | "hi" | "mr";
  maxDurationMinutes: number;
  onEnd: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const SEVERITY_STYLE: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-white/10 bg-white/5 text-surface-300",
};

export function InterviewRoom({
  interviewId,
  candidateId,
  invitationToken,
  jobTitle,
  language,
  maxDurationMinutes,
  onEnd,
}: InterviewRoomProps) {
  const [inputText, setInputText] = useState("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const session = useInterviewSession({
    interviewId,
    candidateId,
    invitationToken,
    maxDurationMinutes,
  });

  const vad = useVAD({
    threshold: 0.02,
    silenceDelay: 1500,
    onSpeechStart: () => {
      // Barge-in: interrupt the AI while it is speaking
      if (session.phase === "speaking") session.interrupt();
    },
    onSpeechEnd: (audioBlob) => {
      if (session.phase === "listening") {
        session.sendAudio(audioBlob);
      }
    },
    onAudioLevel: (level) => session.setAudioLevel(level),
  });

  const proctoring = useProctoring({
    enabled: session.phase === "listening" || session.phase === "speaking",
    interviewId,
  });

  const screenCapture = useScreenCapture({
    enabled: screenSharing,
    captureInterval: 5000,
    onFrame: async (blob) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        if (base64) {
          try {
            await fetch(`${API_URL}/api/proctoring/analyze-screen`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ screenshot: base64, interview_id: interviewId }),
            });
          } catch {}
        }
      };
      reader.readAsDataURL(blob);
    },
  });

  useEffect(() => { session.connect(); }, []);

  // Camera
  useEffect(() => {
    if (cameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => setCameraOn(false));
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); };
  }, [cameraOn]);

  // Mic toggle follows interview phase
  useEffect(() => {
    if (micOn && session.phase === "listening") vad.start();
    else vad.stop();
  }, [micOn, session.phase]);

  // Proctoring start
  useEffect(() => {
    if (cameraOn && videoRef.current && (session.phase === "listening" || session.phase === "speaking")) {
      proctoring.start(videoRef.current);
    }
  }, [cameraOn, session.phase]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [session.messages]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenCapture.stop();
      setScreenSharing(false);
    } else {
      await screenCapture.start();
      setScreenSharing(true);
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    session.sendAnswer(inputText.trim());
    setInputText("");
  };

  const handleEnd = () => {
    session.endInterview();
    vad.stop();
    screenCapture.stop();
    proctoring.stop();
    onEnd();
  };

  const timeWarning = session.timeRemaining <= 300;
  const timeCritical = session.timeRemaining <= 60;
  const proctorSummary = proctoring.getSummary();
  const orbState =
    session.phase === "speaking" ? "speaking"
    : session.phase === "thinking" ? "thinking"
    : session.phase === "listening" ? "listening"
    : session.phase === "completed" ? "complete"
    : session.phase === "error" ? "error"
    : "idle";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#0b0b14] via-[#0d0f1a] to-[#0a0a12] text-white">
      {/* ambient background glows */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-black/20 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">{jobTitle}</h1>
            <p className="text-xs text-surface-400">Voice interview · ARYNOX AI</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-xs text-surface-400 sm:block">
            Question {session.questionNumber}/{session.totalQuestions}
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono ${
            timeCritical ? "bg-red-500/20 text-red-400 animate-pulse" :
            timeWarning ? "bg-amber-500/20 text-amber-400" :
            "bg-white/5 text-surface-300"
          }`}>
            <Clock className="h-3.5 w-3.5" />
            {formatTime(session.timeRemaining)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Voice Stage */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="relative flex items-center justify-center">
            <VoiceOrb
              state={orbState}
              audioLevel={session.audioLevel}
              isMuted={micOn ? false : true}
              size={300}
            />

            {(session.phase === "connecting" || session.phase === "reconnecting") && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-black/40 backdrop-blur-sm">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  <p className="mt-3 text-sm text-surface-300">
                    {session.phase === "connecting" ? "Connecting to your interview…" : "Reconnecting…"}
                  </p>
                </div>
              </div>
            )}

            {session.phase === "error" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-black/50 backdrop-blur-sm">
                <div className="text-center px-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                    <Phone className="h-6 w-6 rotate-[135deg] text-red-400" />
                  </div>
                  <p className="mt-3 text-sm text-red-400">{session.error || "Connection lost"}</p>
                  <button onClick={session.connect} className="mt-3 rounded-lg bg-white/10 px-4 py-1.5 text-xs text-white hover:bg-white/20">
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live question text under the orb */}
          {session.currentQuestion && session.phase === "speaking" && (
            <p className="mt-2 max-w-xl text-center text-sm leading-relaxed text-surface-200">
              {session.currentQuestion}
            </p>
          )}

          {/* Integrity chip row */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              proctorSummary.high > 0 ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`}>
              {proctorSummary.high > 0 ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {proctorSummary.high > 0
                ? `${proctorSummary.high} integrity alert${proctorSummary.high > 1 ? "s" : ""}`
                : "Integrity healthy"}
            </div>
            {vad.isSpeaking && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Listening — speak naturally
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center gap-3">
            <ControlButton active={micOn} onClick={() => setMicOn(!micOn)} title="Microphone">
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </ControlButton>
            <ControlButton active={cameraOn} onClick={() => setCameraOn(!cameraOn)} title="Camera">
              {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </ControlButton>
            <ControlButton active={screenSharing} onClick={toggleScreenShare} title="Share screen">
              <Monitor className="h-5 w-5" />
            </ControlButton>
            <ControlButton active={showTranscript} onClick={() => setShowTranscript(!showTranscript)} title="Transcript">
              <MessageSquare className="h-5 w-5" />
            </ControlButton>
            <ControlButton active={isFullscreen} onClick={toggleFullscreen} title="Fullscreen">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </ControlButton>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 shadow-lg shadow-red-500/25 transition-all hover:bg-red-600"
              title="End interview"
            >
              <Phone className="h-5 w-5 rotate-[135deg]" />
            </button>
          </div>
        </div>

        {/* Right Panel — Transcript */}
        {showTranscript && (
          <div className="flex w-[380px] flex-col overflow-hidden border-l border-white/5 bg-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Live Transcript</h3>
              <button onClick={() => setShowTranscript(false)} className="text-surface-400 hover:text-white">
                <Minimize className="h-4 w-4" />
              </button>
            </div>
            <div ref={transcriptRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {session.messages.length === 0 && (
                <p className="mt-8 text-center text-xs text-surface-500">
                  Your conversation will appear here…
                </p>
              )}
              {session.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "candidate" ? "justify-end" : ""}`}>
                  {msg.role === "ai" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "ai"
                      ? "border border-white/5 bg-white/5 text-surface-200"
                      : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "candidate" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-surface-300">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                  placeholder="Type your answer instead…"
                  className="flex-1 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleSendText}
                  disabled={!inputText.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white transition-all hover:opacity-90 disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proctoring Panel (when transcript hidden) */}
        {!showTranscript && (
          <div className="flex w-[380px] flex-col overflow-hidden border-l border-white/5 bg-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Integrity Monitor
              </h3>
              <button onClick={() => setShowTranscript(true)} className="text-surface-400 hover:text-white">
                <Minimize className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                <SummaryTile value={proctorSummary.high} label="High" tone="red" />
                <SummaryTile value={proctorSummary.medium} label="Medium" tone="amber" />
                <SummaryTile value={proctorSummary.low} label="Low" tone="slate" />
              </div>
              {proctoring.signals.length === 0 ? (
                <p className="mt-4 text-center text-xs text-surface-500">No integrity signals — all good.</p>
              ) : (
                proctoring.signals.slice(-20).reverse().map((signal, i) => (
                  <div key={i} className={`rounded-xl border p-3 text-xs ${SEVERITY_STYLE[signal.severity] ?? SEVERITY_STYLE.low}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{signal.type.replace(/_/g, " ")}</span>
                      <span className="opacity-60">{new Date(signal.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-1 opacity-80">{signal.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Candidate camera PiP */}
      {cameraOn && (
        <div className="fixed bottom-24 right-6 z-30">
          <div className="h-[120px] w-40 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
          </div>
          {screenSharing && (
            <div className="mt-1 flex items-center gap-1 rounded-md bg-indigo-600/80 px-2 py-0.5 text-[10px] text-white">
              <Monitor className="h-2.5 w-2.5" /> Screen sharing
            </div>
          )}
        </div>
      )}

      {/* End Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-white/10 bg-[#12131f] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">End interview?</h3>
            <p className="mt-2 text-sm text-surface-400">
              You&apos;ve answered {session.questionNumber} of {session.totalQuestions} questions. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowEndConfirm(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white hover:bg-white/10">
                Continue
              </button>
              <button onClick={handleEnd} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlButton({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
        active
          ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
          : "border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryTile({ value, label, tone }: { value: number; label: string; tone: "red" | "amber" | "slate" }) {
  const tones = {
    red: "bg-red-500/10 text-red-400",
    amber: "bg-amber-500/10 text-amber-400",
    slate: "bg-white/5 text-surface-300",
  };
  return (
    <div className={`rounded-xl p-2 text-center ${tones[tone]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] opacity-70">{label}</div>
    </div>
  );
}
