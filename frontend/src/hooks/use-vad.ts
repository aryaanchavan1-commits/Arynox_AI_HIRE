"use client";

import { useRef, useCallback, useState, useEffect } from "react";

interface VADOptions {
  threshold?: number;       // RMS threshold for speech detection (0-1)
  silenceDelay?: number;    // ms of silence before marking speech as ended
  preSpeechBuffer?: number; // ms of audio kept before speech start
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

const TARGET_SAMPLE_RATE = 16000;

/** Encode Float32 PCM frames into a 16-bit mono WAV Blob. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);           // PCM
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

/** Simple linear-interpolation downsample. */
function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate >= fromRate) return input;
  const ratio = fromRate / toRate;
  const outLength = Math.floor(input.length / ratio);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcIdx = i * ratio;
    const low = Math.floor(srcIdx);
    const high = Math.min(low + 1, input.length - 1);
    const frac = srcIdx - low;
    out[i] = input[low] * (1 - frac) + input[high] * frac;
  }
  return out;
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
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Capture state
  const isSpeakingRef = useRef(false);
  const sampleRateRef = useRef(48000);
  const frameMsRef = useRef(0);
  const maxPreFramesRef = useRef(0);
  const preFramesRef = useRef<Float32Array[]>([]);
  const speechFramesRef = useRef<Float32Array[]>([]);

  // Keep latest callbacks in refs so the audio loop never uses stale closures
  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const onAudioLevelRef = useRef(onAudioLevel);
  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart;
    onSpeechEndRef.current = onSpeechEnd;
    onAudioLevelRef.current = onAudioLevel;
  }, [onSpeechStart, onSpeechEnd, onAudioLevel]);

  const finishUtterance = useCallback(() => {
    if (!isSpeakingRef.current) return;
    isSpeakingRef.current = false;
    setIsSpeaking(false);

    const frames = [...preFramesRef.current, ...speechFramesRef.current];
    preFramesRef.current = [];
    speechFramesRef.current = [];

    if (frames.length === 0) return;
    // Skip ultra-short blips (< 400ms) — usually coughs/clicks
    const totalMs = frames.length * frameMsRef.current;
    if (totalMs < 400) return;

    const merged = mergeFrames(frames);
    const downsampled = downsample(merged, sampleRateRef.current, TARGET_SAMPLE_RATE);
    const wav = encodeWav(downsampled, TARGET_SAMPLE_RATE);
    onSpeechEndRef.current?.(wav);
  }, []);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try { processorRef.current.disconnect(); } catch { /* noop */ }
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch { /* noop */ }
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => { /* noop */ });
      audioContextRef.current = null;
    }
    isSpeakingRef.current = false;
    preFramesRef.current = [];
    speechFramesRef.current = [];
    setIsListening(false);
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (audioContextRef.current) return; // already running
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      sampleRateRef.current = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ScriptProcessorNode is deprecated but universally supported; it avoids
      // needing a separate AudioWorklet module file.
      const bufferSize = 2048;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;
      frameMsRef.current = (bufferSize / ctx.sampleRate) * 1000;
      maxPreFramesRef.current = Math.max(1, Math.ceil(preSpeechBuffer / frameMsRef.current));

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);

        // Compute RMS
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);

        if (isSpeakingRef.current) {
          speechFramesRef.current.push(new Float32Array(input));
        }

        const speaking = rms > threshold;
        if (speaking) {
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            speechFramesRef.current = [];
            onSpeechStartRef.current?.();
          }
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          // Keep the silence timer armed so trailing silence ends the utterance
          silenceTimerRef.current = setTimeout(finishUtterance, silenceDelay);
        } else if (isSpeakingRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(finishUtterance, silenceDelay);
        }

        // Maintain rolling pre-speech buffer
        if (!isSpeakingRef.current) {
          preFramesRef.current.push(new Float32Array(input));
          if (preFramesRef.current.length > maxPreFramesRef.current) {
            preFramesRef.current.shift();
          }
        }
      };

      source.connect(processor);
      // Required for ScriptProcessor to pull audio in Chrome; route to a zero-gain mute
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);

      setIsListening(true);
    } catch (err: any) {
      cleanup();
      setError(err?.message || "Failed to access microphone");
    }
  }, [threshold, silenceDelay, preSpeechBuffer, cleanup, finishUtterance]);

  const stop = useCallback(() => {
    finishUtterance();
    cleanup();
  }, [finishUtterance, cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isListening, isSpeaking, audioLevel, start, stop, error };
}

function mergeFrames(frames: Float32Array[]): Float32Array {
  const total = frames.reduce((s, f) => s + f.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const f of frames) {
    out.set(f, offset);
    offset += f.length;
  }
  return out;
}
