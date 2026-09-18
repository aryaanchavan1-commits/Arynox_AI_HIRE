"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ProctoringSignal {
  event: string;
  details: string;
  timestamp: string;
}

interface UseProctoringOptions {
  enabled?: boolean;
  onSignal?: (signal: ProctoringSignal) => void;
}

export function useProctoring({ enabled = true, onSignal }: UseProctoringOptions = {}) {
  const [signals, setSignals] = useState<ProctoringSignal[]>([]);
  const [facePresent, setFacePresent] = useState(true);
  const lastHiddenTime = useRef(0);

  const emitSignal = useCallback((event: string, details: string) => {
    const signal: ProctoringSignal = { event, details, timestamp: new Date().toISOString() };
    setSignals((prev) => [...prev, signal]);
    onSignal?.(signal);
  }, [onSignal]);

  useEffect(() => {
    if (!enabled) return;

    // Tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        lastHiddenTime.current = Date.now();
        emitSignal("TAB_HIDDEN", "Candidate tab became hidden");
      } else if (lastHiddenTime.current > 0) {
        const duration = ((Date.now() - lastHiddenTime.current) / 1000).toFixed(1);
        emitSignal("TAB_VISIBLE", `Candidate returned after ${duration}s`);
        lastHiddenTime.current = 0;
      }
    };

    // Window blur/focus
    const handleBlur = () => emitSignal("WINDOW_BLUR", "Candidate window lost focus");
    const handleFocus = () => emitSignal("WINDOW_FOCUS", "Candidate window gained focus");

    // Fullscreen change
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        emitSignal("FULLSCREEN_EXIT", "Candidate exited fullscreen");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [enabled, emitSignal]);

  return { signals, facePresent, setFacePresent };
}
