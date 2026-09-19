"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare,
  Clock, Send, Bot, User, Volume2, VolumeX, Maximize, Minimize,
  Monitor, AlertTriangle, Eye,
} from "lucide-react";
import { VoiceVisualizer } from "@/components/avatar/voice-visualizer";
import { useVAD } from "@/hooks/use-vad";
import { useInterviewSession } from "@/hooks/use-interview-session";
import { useScreenCapture } from "@/hooks/use-screen-capture";
import { useProctoring } from "@/hooks/use-proctoring";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  const [audioOutput, setAudioOutput] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showProctoring, setShowProctoring] = useState(false);

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
      if (session.phase === "listening") session.interrupt();
    },
    onSpeechEnd: (audioBlob) => {
      if (session.phase === "listening" || session.phase === "speaking") {
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

  // Mic toggle
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

  return (
    <div className="flex h-screen flex-col bg-surface-950 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-surface-900/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <span className="text-xs font-bold text-white">AI</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold">{jobTitle}</h1>
            <p className="text-xs text-surface-400">ARYNOX AI HIRE Interview</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-surface-400">
            Question {session.questionNumber}/{session.totalQuestions}
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono ${
            timeCritical ? "bg-red-500/20 text-red-400 animate-pulse" :
            timeWarning ? "bg-amber-500/20 text-amber-400" :
            "bg-surface-800 text-surface-300"
          }`}>
            <Clock className="h-3.5 w-3.5" />
            {formatTime(session.timeRemaining)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Voice Visualizer Area */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          {/* Voice Visualizer */}
          <div className="relative flex items-center justify-center">
            <VoiceVisualizer
              state={session.avatarState}
              audioLevel={session.audioLevel}
              size={300}
            />

            {/* Connection status */}
            {(session.phase === "connecting" || session.phase === "reconnecting") && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent mx-auto" />
                  <p className="mt-3 text-sm text-surface-300">
                    {session.phase === "connecting" ? "Connecting..." : "Reconnecting..."}
                  </p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {session.phase === "error" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                    <Phone className="h-6 w-6 text-red-400 rotate-[135deg]" />
                  </div>
                  <p className="mt-3 text-sm text-red-400">{session.error || "Connection lost"}</p>
                  <button onClick={session.connect} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Proctoring alerts bar */}
          {proctoring.isMonitoring && proctorSummary.high > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-300">
                {proctorSummary.high} high-severity alerts detected
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                micOn ? "bg-surface-700 text-white hover:bg-surface-600" : "bg-red-500 text-white shadow-lg shadow-red-500/25"
              }`}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                cameraOn ? "bg-surface-700 text-white hover:bg-surface-600" : "bg-red-500 text-white shadow-lg shadow-red-500/25"
              }`}
            >
              {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                screenSharing ? "bg-indigo-600 text-white" : "bg-surface-700 text-surface-400 hover:bg-surface-600"
              }`}
              title="Share screen"
            >
              <Monitor className="h-5 w-5" />
            </button>

            <button
              onClick={() => setAudioOutput(!audioOutput)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                audioOutput ? "bg-surface-700 text-white hover:bg-surface-600" : "bg-surface-700 text-surface-500"
              }`}
            >
              {audioOutput ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="h-12 w-12 rounded-2xl flex items-center justify-center bg-surface-700 text-white hover:bg-surface-600 transition-all"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                showTranscript ? "bg-indigo-600 text-white" : "bg-surface-700 text-surface-400 hover:bg-surface-600"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShowProctoring(!showProctoring)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                showProctoring ? "bg-amber-600 text-white" : "bg-surface-700 text-surface-400 hover:bg-surface-600"
              }`}
              title="Proctoring"
            >
              <Eye className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShowEndConfirm(true)}
              className="h-12 w-12 rounded-2xl flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/25"
            >
              <Phone className="h-5 w-5 rotate-[135deg]" />
            </button>
          </div>

          {/* Recording indicator */}
          {vad.isSpeaking && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Listening — speak naturally
            </div>
          )}
        </div>

        {/* Right Panel - Transcript or Proctoring */}
        {showTranscript && (
          <div className="w-[380px] border-l border-white/10 bg-surface-900/50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Transcript</h3>
              <button onClick={() => setShowTranscript(false)} className="text-surface-400 hover:text-white">
                <Minimize className="h-4 w-4" />
              </button>
            </div>
            <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {session.messages.length === 0 && (
                <p className="text-xs text-surface-500 text-center mt-8">
                  Interview transcript will appear here...
                </p>
              )}
              {session.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "candidate" ? "justify-end" : ""}`}>
                  {msg.role === "ai" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "ai" ? "bg-surface-800 text-surface-200" : "bg-indigo-600 text-white"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "candidate" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-700 text-surface-300">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                  placeholder="Type answer..."
                  className="flex-1 rounded-xl bg-surface-800 px-4 py-2.5 text-sm text-white placeholder:text-surface-500 border border-white/5 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendText}
                  disabled={!inputText.trim()}
                  className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-30 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proctoring Panel */}
        {showProctoring && !showTranscript && (
          <div className="w-[380px] border-l border-white/10 bg-surface-900/50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-400" />
                Proctoring
              </h3>
              <button onClick={() => setShowProctoring(false)} className="text-surface-400 hover:text-white">
                <Minimize className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Status */}
              <div className="rounded-lg bg-surface-800 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-400">Monitoring</span>
                  <div className={`h-2 w-2 rounded-full ${proctoring.isMonitoring ? "bg-green-400 animate-pulse" : "bg-surface-500"}`} />
                </div>
                <p className="mt-1 text-xs text-surface-300">
                  {proctoring.isMonitoring ? "Camera analysis active" : "Inactive"}
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-red-500/10 p-2 text-center">
                  <div className="text-lg font-bold text-red-400">{proctorSummary.high}</div>
                  <div className="text-[10px] text-red-300">High</div>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2 text-center">
                  <div className="text-lg font-bold text-amber-400">{proctorSummary.medium}</div>
                  <div className="text-[10px] text-amber-300">Medium</div>
                </div>
                <div className="rounded-lg bg-surface-700 p-2 text-center">
                  <div className="text-lg font-bold text-surface-300">{proctorSummary.low}</div>
                  <div className="text-[10px] text-surface-400">Low</div>
                </div>
              </div>

              {/* Signal list */}
              {proctoring.signals.length === 0 ? (
                <p className="text-xs text-surface-500 text-center mt-4">No alerts yet</p>
              ) : (
                proctoring.signals.slice(-20).reverse().map((signal, i) => (
                  <div key={i} className={`rounded-lg border p-2 text-xs ${
                    signal.severity === "high" ? "border-red-500/20 bg-red-500/5" :
                    signal.severity === "medium" ? "border-amber-500/20 bg-amber-500/5" :
                    "border-surface-700 bg-surface-800"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={
                        signal.severity === "high" ? "text-red-400" :
                        signal.severity === "medium" ? "text-amber-400" : "text-surface-400"
                      }>
                        {signal.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-surface-500">
                        {new Date(signal.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-surface-400">{signal.details}</p>
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
          <div className="w-40 h-30 rounded-xl overflow-hidden border border-white/10 bg-black shadow-xl">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-surface-900 border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">End Interview?</h3>
            <p className="mt-2 text-sm text-surface-400">
              You&apos;ve answered {session.questionNumber} of {session.totalQuestions} questions.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowEndConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-surface-800 py-2.5 text-sm font-medium text-white hover:bg-surface-700 transition-all">
                Continue
              </button>
              <button onClick={handleEnd}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-all">
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
