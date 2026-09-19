"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { InterviewMessage, InterviewPhase, AvatarState } from "@/lib/providers/types";
import { API_URL } from "@/lib/utils";

interface UseInterviewSessionOptions {
  interviewId: string;
  candidateId: string;
  invitationToken: string;
  maxDurationMinutes: number;
  onPhaseChange?: (phase: InterviewPhase) => void;
}

interface UseInterviewSessionResult {
  phase: InterviewPhase;
  avatarState: AvatarState;
  currentQuestion: string;
  currentSkill: string;
  questionNumber: number;
  totalQuestions: number;
  timeElapsed: number;
  timeRemaining: number;
  messages: InterviewMessage[];
  transcript: Array<{ role: "ai" | "candidate"; content: string; timestamp: string }>;
  audioLevel: number;
  error: string | null;
  connect: () => void;
  sendAnswer: (text: string) => void;
  sendAudio: (audioBlob: Blob) => void;
  interrupt: () => void;
  endInterview: () => void;
  setAudioLevel: (level: number) => void;
}

const MAX_RECONNECT = 5;

export function useInterviewSession({
  interviewId,
  candidateId,
  invitationToken,
  maxDurationMinutes,
  onPhaseChange,
}: UseInterviewSessionOptions): UseInterviewSessionResult {
  const [phase, setPhase] = useState<InterviewPhase>("initializing");
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentSkill, setCurrentSkill] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(maxDurationMinutes * 60);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [transcript, setTranscript] = useState<Array<{ role: "ai" | "candidate"; content: string; timestamp: string }>>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<number>(0);
  // Refs so callbacks never read stale state
  const phaseRef = useRef<InterviewPhase>("initializing");
  const currentQuestionRef = useRef("");
  const currentSkillRef = useRef("");
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against React StrictMode double-connect and reconnect-after-end
  const intentionallyClosedRef = useRef(false);
  const connectingRef = useRef(false);

  const updatePhase = useCallback(
    (p: InterviewPhase) => {
      phaseRef.current = p;
      setPhase(p);
      onPhaseChange?.(p);
    },
    [onPhaseChange]
  );

  const handleMessage = useCallback(
    (msg: any) => {
      const { type, payload } = msg;

      switch (type) {
        case "welcome":
        case "question": {
          const text = payload?.text || payload?.question || "";
          if (!text) break;
          const skill = payload?.skill || "";
          const qNum = payload?.question_number || questionNumber + 1;
          const total = payload?.total_questions || totalQuestions;

          currentQuestionRef.current = text;
          currentSkillRef.current = skill;
          setCurrentQuestion(text);
          setCurrentSkill(skill);
          setQuestionNumber(qNum);
          setTotalQuestions(total);
          updatePhase("speaking");
          setAvatarState("speaking");

          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "ai", content: text, timestamp: new Date(), skill },
          ]);
          setTranscript((prev) => [...prev, { role: "ai", content: text, timestamp: new Date().toISOString() }]);

          // Play the AI's voice; when it ends, switch to listening
          playAiAudio(payload?.audio, text);
          break;
        }

        case "feedback": {
          const feedback = payload?.feedback || payload?.text || "";
          if (feedback) {
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: "ai", content: feedback, timestamp: new Date() },
            ]);
          }
          break;
        }

        case "complete": {
          stopAiAudio();
          updatePhase("completed");
          setAvatarState("idle");
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "ai", content: "Interview complete! Thank you for your time.", timestamp: new Date() },
          ]);
          break;
        }

        case "transcription": {
          const text = payload?.text || "";
          if (text) {
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: "candidate", content: text, timestamp: new Date() },
            ]);
            setTranscript((prev) => [...prev, { role: "candidate", content: text, timestamp: new Date().toISOString() }]);
          }
          break;
        }

        case "interrupt": {
          stopAiAudio();
          setAvatarState("listening");
          updatePhase("listening");
          break;
        }

        case "error": {
          setError(payload?.message || "Unknown error");
          updatePhase("error");
          break;
        }
      }
    },
    // questionNumber/totalQuestions are only read to derive next values; keeping them
    // out of deps is safe because the ref-free fallback is best-effort UI data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updatePhase]
  );

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (connectingRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    intentionallyClosedRef.current = false;
    connectingRef.current = true;
    updatePhase("connecting");
    setError(null);

    // WebSocket lives on the backend (port 8000), not the Next.js origin
    const wsBase = API_URL.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsBase}/ws/interview/${interviewId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      connectingRef.current = false;
      reconnectRef.current = 0;
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { interviewId, candidateId, invitationToken, role: "candidate" },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        handleMessage(JSON.parse(event.data));
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      connectingRef.current = false;
      if (intentionallyClosedRef.current) return;
      if (phaseRef.current === "completed" || phaseRef.current === "error") return;
      if (reconnectRef.current < MAX_RECONNECT) {
        reconnectRef.current += 1;
        updatePhase("reconnecting");
        connectTimeoutRef.current = setTimeout(connect, 2000 * reconnectRef.current);
      } else {
        setError("Connection lost. Please refresh the page.");
        updatePhase("error");
      }
    };

    ws.onerror = () => {
      setError("Connection error. Retrying...");
    };
  }, [interviewId, candidateId, invitationToken, handleMessage, updatePhase]);

  /** Play base64 AI audio; fall back to estimated timing if TTS unavailable. */
  const playAiAudio = useCallback(
    (base64Audio: string | undefined, fallbackText: string) => {
      stopAiAudio();
      if (base64Audio) {
        try {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
          audioRef.current = audio;
          audio.onended = () => {
            if (phaseRef.current !== "completed" && phaseRef.current !== "error") {
              updatePhase("listening");
              setAvatarState("listening");
            }
          };
          audio.onerror = () => {
            // Fall back to text-length timing if playback fails
            scheduleFallbackListening(fallbackText);
          };
          audio.play().catch(() => scheduleFallbackListening(fallbackText));
          return;
        } catch {
          /* fall through to timing fallback */
        }
      }
      scheduleFallbackListening(fallbackText);
    },
    [updatePhase]
  );

  const scheduleFallbackListening = useCallback(
    (text: string) => {
      const estimatedDuration = Math.max(2500, Math.min(15000, text.length * 55));
      speakTimeoutRef.current = setTimeout(() => {
        if (phaseRef.current !== "completed" && phaseRef.current !== "error" && phaseRef.current === "speaking") {
          updatePhase("listening");
          setAvatarState("listening");
        }
      }, estimatedDuration);
    },
    [updatePhase]
  );

  const stopAiAudio = useCallback(() => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const sendAnswer = useCallback(
    (text: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "candidate", content: text, timestamp: new Date() },
      ]);
      setTranscript((prev) => [...prev, { role: "candidate", content: text, timestamp: new Date().toISOString() }]);

      updatePhase("thinking");
      setAvatarState("thinking");

      ws.send(
        JSON.stringify({
          type: "answer",
          payload: { answer: text, question: currentQuestionRef.current, skill: currentSkillRef.current },
        })
      );
    },
    [updatePhase]
  );

  const sendAudio = useCallback((audioBlob: Blob) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (base64) {
        wsRef.current?.send(JSON.stringify({ type: "audio", payload: { audio: base64 } }));
      }
    };
    reader.readAsDataURL(audioBlob);
  }, []);

  const interrupt = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "interrupt" }));
    setAvatarState("interrupted");
    updatePhase("listening");
  }, [updatePhase]);

  const endInterview = useCallback(() => {
    intentionallyClosedRef.current = true;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "end" }));
    }
    updatePhase("completed");
    setAvatarState("idle");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [updatePhase]);

  // Full teardown: close socket, cancel timers, stop audio
  const destroy = useCallback(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    intentionallyClosedRef.current = true;
    connectingRef.current = false;
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopAiAudio();
    const ws = wsRef.current;
    if (ws) {
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      try {
        ws.close();
      } catch {
        // already closed
      }
      wsRef.current = null;
    }
  }, []);

  // Timer
  useEffect(() => {
    if (phase === "listening" || phase === "speaking" || phase === "thinking") {
      timerRef.current = setInterval(() => {
        setTimeElapsed((t) => t + 1);
        setTimeRemaining((t) => Math.max(0, t - 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  // Auto-end when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && phase !== "completed" && phase !== "error") {
      endInterview();
    }
  }, [timeRemaining, phase, endInterview]);

  // Cleanup on unmount (also makes StrictMode double-mount safe)
  useEffect(() => {
    return () => destroy();
  }, [destroy]);

  return {
    phase,
    avatarState,
    currentQuestion,
    currentSkill,
    questionNumber,
    totalQuestions,
    timeElapsed,
    timeRemaining,
    messages,
    transcript,
    audioLevel,
    error,
    connect,
    sendAnswer,
    sendAudio,
    interrupt,
    endInterview,
    setAudioLevel,
  };
}
