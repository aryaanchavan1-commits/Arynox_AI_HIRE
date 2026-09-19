"use client";

import { useRef, useCallback, useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ProctoringSignal {
  type: "face_absent" | "multiple_faces" | "looking_away" | "eyes_closed" | "low_attention" | "screen_suspicious" | "tab_switch";
  severity: "low" | "medium" | "high";
  details: string;
  timestamp: string;
}

interface UseProctoringOptions {
  enabled: boolean;
  interviewId?: string;
  captureInterval?: number;
}

interface UseProctoringResult {
  signals: ProctoringSignal[];
  isMonitoring: boolean;
  start: (videoElement: HTMLVideoElement) => void;
  stop: () => void;
  getSummary: () => { total: number; high: number; medium: number; low: number };
}

export function useProctoring(options: UseProctoringOptions): UseProctoringResult {
  const { enabled, interviewId = "default", captureInterval = 3000 } = options;
  const [signals, setSignals] = useState<ProctoringSignal[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 640, 480);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.5);
    });
    if (!blob) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      if (!base64) return;

      try {
        const resp = await fetch(`${API_URL}/api/proctoring/analyze-frame`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frame: base64, interview_id: interviewId }),
        });
        if (!resp.ok) return;
        const data = await resp.json();

        const newSignals: ProctoringSignal[] = [];
        const now = new Date().toISOString();

        if (data.face_count === 0) {
          newSignals.push({ type: "face_absent", severity: "high", details: "No face detected", timestamp: now });
        } else if (data.face_count > 1) {
          newSignals.push({ type: "multiple_faces", severity: "high", details: `${data.face_count} faces detected`, timestamp: now });
        }

        if (data.gaze === "looking_away") {
          newSignals.push({ type: "looking_away", severity: "medium", details: "Candidate looking away from screen", timestamp: now });
        } else if (data.gaze === "eyes_closed") {
          newSignals.push({ type: "eyes_closed", severity: "low", details: "Eyes appear closed", timestamp: now });
        }

        if (data.expression && data.expression.attention < 0.3) {
          newSignals.push({ type: "low_attention", severity: "medium", details: `Attention level: ${Math.round(data.expression.attention * 100)}%`, timestamp: now });
        }

        if (newSignals.length > 0) {
          setSignals((prev) => [...prev, ...newSignals]);
        }
      } catch {
        // Silently ignore network errors
      }
    };
    reader.readAsDataURL(blob);
  }, [interviewId]);

  const start = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    setIsMonitoring(true);
    intervalRef.current = setInterval(captureAndAnalyze, captureInterval);
  }, [captureAndAnalyze, captureInterval]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    videoRef.current = null;
  }, []);

  const getSummary = useCallback(() => {
    const high = signals.filter((s) => s.severity === "high").length;
    const medium = signals.filter((s) => s.severity === "medium").length;
    const low = signals.filter((s) => s.severity === "low").length;
    return { total: signals.length, high, medium, low };
  }, [signals]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  useEffect(() => {
    if (!enabled && isMonitoring) stop();
  }, [enabled, isMonitoring, stop]);

  return { signals, isMonitoring, start, stop, getSummary };
}
