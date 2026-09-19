"use client";

import { useRef, useCallback, useState, useEffect } from "react";

interface UseScreenCaptureOptions {
  enabled?: boolean;
  captureInterval?: number;
  onFrame?: (blob: Blob) => void;
}

interface UseScreenCaptureResult {
  isCapturing: boolean;
  start: () => Promise<void>;
  stop: () => void;
  screenshot: () => Promise<Blob | null>;
  error: string | null;
}

export function useScreenCapture(options: UseScreenCaptureOptions = {}): UseScreenCaptureResult {
  const { enabled = true, captureInterval = 5000, onFrame } = options;
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.6);
    });
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1280, height: 720, frameRate: { max: 1 } } as any,
        audio: false,
      });

      streamRef.current = stream;

      // Create hidden video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.style.display = "none";
      document.body.appendChild(video);
      videoRef.current = video;

      // Handle stream end (user clicks "Stop Sharing")
      stream.getVideoTracks()[0].onended = () => {
        stop();
      };

      setIsCapturing(true);

      // Periodic capture
      if (onFrame) {
        intervalRef.current = setInterval(async () => {
          const blob = await captureFrame();
          if (blob) onFrame(blob);
        }, captureInterval);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Screen capture failed");
      }
    }
  }, [captureInterval, onFrame, captureFrame]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.remove();
      videoRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const screenshot = useCallback(async (): Promise<Blob | null> => {
    return captureFrame();
  }, [captureFrame]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { isCapturing, start, stop, screenshot, error };
}
