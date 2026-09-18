"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { InterviewMessage, InterviewPhase, AvatarState } from "@/lib/providers/types";

interface UseInterviewSessionOptions {
  interviewId: string;
  candidateId: string;
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

export function useInterviewSession({
  interviewId,
  candidateId,
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectRef = useRef<number>(0);
  const maxReconnect = 5;

  const updatePhase = useCallback((p: InterviewPhase) => {
    setPhase(p);
    onPhaseChange?.(p);
  }, [onPhaseChange]);

  const connect = useCallback(() => {
    updatePhase("connecting");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/interview/${interviewId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectRef.current = 0;
      ws.send(JSON.stringify({
        type: "join",
        payload: { interviewId, candidateId, role: "candidate" },
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch {}
    };

    ws.onclose = () => {
      if (phase !== "completed" && phase !== "error" && reconnectRef.current < maxReconnect) {
        reconnectRef.current++;
        updatePhase("reconnecting");
        setTimeout(connect, 2000 * reconnectRef.current);
      }
    };

    ws.onerror = () => {
      setError("Connection error. Retrying...");
    };
  }, [interviewId, candidateId, phase, updatePhase]);

  const handleMessage = useCallback((msg: any) => {
    const { type, payload } = msg;

    switch (type) {
      case "welcome":
      case "question": {
        const text = payload?.text || payload?.question || "";
        const skill = payload?.skill || "";
        const qNum = payload?.question_number || questionNumber + 1;
        const total = payload?.total_questions || totalQuestions;

        setCurrentQuestion(text);
        setCurrentSkill(skill);
        setQuestionNumber(qNum);
        setTotalQuestions(total);
        updatePhase("speaking");
        setAvatarState("speaking");

        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: "ai",
          content: text,
          timestamp: new Date(),
          skill,
        }]);

        setTranscript((prev) => [...prev, {
          role: "ai",
          content: text,
          timestamp: new Date().toISOString(),
        }]);

        // After AI finishes speaking, switch to listening
        const estimatedDuration = Math.max(2000, text.length * 50);
        setTimeout(() => {
          if (phase !== "completed" && phase !== "error") {
            updatePhase("listening");
            setAvatarState("listening");
          }
        }, estimatedDuration);
        break;
      }

      case "feedback": {
        const feedback = payload?.feedback || "";
        if (feedback) {
          setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            role: "ai",
            content: feedback,
            timestamp: new Date(),
          }]);
        }
        break;
      }

      case "complete": {
        updatePhase("completed");
        setAvatarState("idle");
        if (timerRef.current) clearInterval(timerRef.current);
        const eval_ = payload?.evaluation;
        if (eval_) {
          setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            role: "ai",
            content: "Interview complete! Thank you for your time.",
            timestamp: new Date(),
          }]);
        }
        break;
      }

      case "transcription": {
        const text = payload?.text || "";
        if (text) {
          setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            role: "candidate",
            content: text,
            timestamp: new Date(),
          }]);
          setTranscript((prev) => [...prev, {
            role: "candidate",
            content: text,
            timestamp: new Date().toISOString(),
          }]);
        }
        break;
      }

      case "interrupt": {
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
  }, [phase, questionNumber, totalQuestions, updatePhase]);

  const sendAnswer = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      role: "candidate",
      content: text,
      timestamp: new Date(),
    }]);
    setTranscript((prev) => [...prev, {
      role: "candidate",
      content: text,
      timestamp: new Date().toISOString(),
    }]);

    updatePhase("thinking");
    setAvatarState("thinking");

    wsRef.current.send(JSON.stringify({
      type: "answer",
      payload: { answer: text, question: currentQuestion, skill: currentSkill },
    }));
  }, [currentQuestion, currentSkill, updatePhase]);

  const sendAudio = useCallback((audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      wsRef.current?.send(JSON.stringify({
        type: "audio",
        payload: { audio: base64 },
      }));
    };
    reader.readAsDataURL(audioBlob);
  }, []);

  const interrupt = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "interrupt" }));
    setAvatarState("interrupted");
    updatePhase("listening");
  }, [updatePhase]);

  const endInterview = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end" }));
    }
    updatePhase("completed");
    setAvatarState("idle");
    if (timerRef.current) clearInterval(timerRef.current);
  }, [updatePhase]);

  // Timer
  useEffect(() => {
    if (phase === "listening" || phase === "speaking" || phase === "thinking") {
      timerRef.current = setInterval(() => {
        setTimeElapsed((t) => t + 1);
        setTimeRemaining((t) => Math.max(0, t - 1));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Auto-end when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && phase !== "completed" && phase !== "error") {
      endInterview();
    }
  }, [timeRemaining, phase, endInterview]);

  return {
    phase, avatarState, currentQuestion, currentSkill,
    questionNumber, totalQuestions, timeElapsed, timeRemaining,
    messages, transcript, audioLevel, error,
    connect, sendAnswer, sendAudio, interrupt, endInterview, setAudioLevel,
  };
}
