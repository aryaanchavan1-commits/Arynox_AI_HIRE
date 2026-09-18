"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare,
  Clock, Send, Bot, User, Volume2, VolumeX, Maximize, Minimize,
} from "lucide-react";
import { UnifiedAvatar } from "@/components/avatar/tavus-avatar";
import { useVAD } from "@/hooks/use-vad";
import { useProctoring } from "@/hooks/use-proctoring";
import { useInterviewSession } from "@/hooks/use-interview-session";

interface InterviewRoomProps {
  interviewId: string;
  candidateId: string;
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

  const transcriptRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Interview session
  const session = useInterviewSession({
    interviewId,
    candidateId,
    maxDurationMinutes,
  });

  // VAD
  const vad = useVAD({
    threshold: 0.02,
    silenceDelay: 1500,
    onSpeechStart: () => {
      if (session.phase === "listening") {
        session.interrupt();
      }
    },
    onSpeechEnd: (audioBlob) => {
      if (session.phase === "listening" || session.phase === "speaking") {
        session.sendAudio(audioBlob);
      }
    },
    onAudioLevel: (level) => session.setAudioLevel(level),
  });

  // Proctoring
  const proctoring = useProctoring({
    enabled: session.phase === "listening" || session.phase === "speaking",
    onSignal: () => {},
  });

  // Connect on mount
  useEffect(() => {
    session.connect();
  }, []);

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
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [cameraOn]);

  // Mic toggle
  useEffect(() => {
    if (micOn && (session.phase === "listening")) {
      vad.start();
    } else {
      vad.stop();
    }
  }, [micOn, session.phase]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [session.messages]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Send text answer
  const handleSendText = () => {
    if (!inputText.trim()) return;
    session.sendAnswer(inputText.trim());
    setInputText("");
  };

  const handleEnd = () => {
    session.endInterview();
    vad.stop();
    onEnd();
  };

  const timeWarning = session.timeRemaining <= 300;
  const timeCritical = session.timeRemaining <= 60;

  return (
    <div className="flex h-screen flex-col bg-surface-950 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-surface-900/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">{jobTitle}</h1>
            <p className="text-xs text-surface-400">Technical Interview</p>
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
        {/* Avatar Area */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          {/* Avatar */}
          <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-surface-800 to-surface-900 border border-white/5 shadow-2xl">
            <UnifiedAvatar
              state={session.avatarState}
              audioLevel={session.audioLevel}
              text={session.currentQuestion}
              language={language}
              className="h-full w-full"
            />

            {/* Connection status */}
            {(session.phase === "connecting" || session.phase === "reconnecting") && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent mx-auto" />
                  <p className="mt-3 text-sm text-surface-300">
                    {session.phase === "connecting" ? "Connecting..." : "Reconnecting..."}
                  </p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {session.phase === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center px-6">
                  <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                    <Phone className="h-6 w-6 text-red-400 rotate-[135deg]" />
                  </div>
                  <p className="mt-3 text-sm text-red-400">{session.error || "Connection lost"}</p>
                  <button onClick={session.connect} className="mt-3 text-xs text-brand-400 hover:text-brand-300">
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                micOn ? "bg-surface-700 text-white hover:bg-surface-600" : "bg-red-500 text-white shadow-lg shadow-red-500/25"
              }`}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                cameraOn ? "bg-surface-700 text-white hover:bg-surface-600" : "bg-red-500 text-white shadow-lg shadow-red-500/25"
              }`}
              aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setAudioOutput(!audioOutput)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                audioOutput ? "bg-surface-700 text-white hover:bg-surface-600" : "bg-surface-700 text-surface-500"
              }`}
              aria-label={audioOutput ? "Mute audio" : "Unmute audio"}
            >
              {audioOutput ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="h-12 w-12 rounded-2xl flex items-center justify-center bg-surface-700 text-white hover:bg-surface-600 transition-all"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                showTranscript ? "bg-brand-600 text-white" : "bg-surface-700 text-surface-400 hover:bg-surface-600"
              }`}
              aria-label="Toggle transcript"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShowEndConfirm(true)}
              className="h-12 w-12 rounded-2xl flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/25"
              aria-label="End interview"
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

        {/* Transcript Sidebar */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-white/10 bg-surface-900/50 flex flex-col overflow-hidden"
            >
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
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "ai"
                        ? "bg-surface-800 text-surface-200"
                        : "bg-brand-600 text-white"
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
              {/* Text input */}
              <div className="border-t border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                    placeholder="Type answer..."
                    className="flex-1 rounded-xl bg-surface-800 px-4 py-2.5 text-sm text-white placeholder:text-surface-500 border border-white/5 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={handleSendText}
                    disabled={!inputText.trim()}
                    className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white hover:bg-brand-700 disabled:opacity-30 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Candidate camera PiP */}
      {cameraOn && (
        <div className="fixed bottom-24 right-6 z-30">
          <div className="w-40 h-30 rounded-xl overflow-hidden border border-white/10 bg-black shadow-xl">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover mirror" style={{ transform: "scaleX(-1)" }} />
          </div>
        </div>
      )}

      {/* End Confirmation Modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="mx-4 w-full max-w-sm rounded-2xl bg-surface-900 border border-white/10 p-6 shadow-2xl">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
