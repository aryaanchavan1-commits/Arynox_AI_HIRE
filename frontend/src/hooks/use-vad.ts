"use client";

import { useRef, useCallback, useState, useEffect } from "react";

interface VADOptions {
  threshold?: number;       // RMS threshold for speech detection (0-1)
  silenceDelay?: number;    // ms of silence before marking as stopped
  preSpeechBuffer?: number; // ms of audio to keep before speech start
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob) => void;
  onAudioLevel?: (level: number) => void;
}

interface VADResult {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useVAD(options: VADOptions = {}): VADResult {
  const {
    threshold = 0.02,
    silenceDelay = 1500,
    preSpeechBuffer = 500,
    onSpeechStart,
    onSpeechEnd,
    onAudioLevel,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preSpeechBufferRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isSpeakingRef = useRef(false);
  const lastSpeechTime = useRef(0);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up MediaRecorder for capturing audio
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;
      preSpeechBufferRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          if (!isSpeakingRef.current) {
            // Buffer pre-speech audio
            preSpeechBufferRef.current.push(e.data);
            // Keep only last N ms
            const maxBuffers = Math.ceil(preSpeechBuffer / 100);
            if (preSpeechBufferRef.current.length > maxBuffers) {
              preSpeechBufferRef.current.shift();
            }
          } else {
            // Accumulate speech audio
            preSpeechBufferRef.current.push(e.data);
          }
        }
      };

      recorder.onstop = () => {
        if (isSpeakingRef.current && preSpeechBufferRef.current.length > 0) {
          const blob = new Blob(preSpeechBufferRef.current, { type: "audio/webm" });
          onSpeechEnd?.(blob);
          preSpeechBufferRef.current = [];
        }
      };

      recorder.start(100); // 100ms chunks
      setIsListening(true);

      // VAD loop
      const dataArray = new Float32Array(analyser.frequencyBinCount);
      let frameCount = 0;

      const checkAudio = () => {
        analyser.getFloatTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length);

        // Throttle audio level updates to ~15fps to avoid re-render storm
        frameCount++;
        if (frameCount % 4 === 0) {
          const normalizedLevel = Math.min(1, rms * 5);
          setAudioLevel(normalizedLevel);
          onAudioLevel?.(normalizedLevel);
        }

        const now = Date.now();
        const speaking = rms > threshold;

        if (speaking) {
          lastSpeechTime.current = now;
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            onSpeechStart?.();
          }
          // Reset silence timer
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (isSpeakingRef.current) {
              isSpeakingRef.current = false;
              setIsSpeaking(false);
              // Stop recorder to trigger onstop with accumulated audio
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
                // Restart for next utterance
                setTimeout(() => {
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
                    try { mediaRecorderRef.current.start(100); } catch {}
                  }
                }, 50);
              }
            }
          }, silenceDelay);
        }

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      animFrameRef.current = requestAnimationFrame(checkAudio);
    } catch (err: any) {
      setError(err.message || "Failed to access microphone");
    }
  }, [threshold, silenceDelay, preSpeechBuffer, onSpeechStart, onSpeechEnd, onAudioLevel]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isListening, isSpeaking, audioLevel, start, stop, error };
}
