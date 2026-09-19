"use client";

import { useRef, useEffect, useMemo } from "react";
import { AvatarState } from "@/lib/providers/types";

interface VoiceVisualizerProps {
  state: AvatarState;
  audioLevel: number;
  size?: number;
  className?: string;
}

const STATE_COLORS: Record<AvatarState, { ring: string; glow: string; text: string; bg: string }> = {
  idle: { ring: "#6366f1", glow: "rgba(99,102,241,0.15)", text: "#818cf8", bg: "from-indigo-500/10 to-purple-500/10" },
  listening: { ring: "#22c55e", glow: "rgba(34,197,94,0.2)", text: "#4ade80", bg: "from-green-500/10 to-emerald-500/10" },
  thinking: { ring: "#f59e0b", glow: "rgba(245,158,11,0.2)", text: "#fbbf24", bg: "from-amber-500/10 to-orange-500/10" },
  speaking: { ring: "#6366f1", glow: "rgba(99,102,241,0.3)", text: "#818cf8", bg: "from-indigo-500/15 to-purple-500/15" },
  interrupted: { ring: "#f97316", glow: "rgba(249,115,22,0.2)", text: "#fb923c", bg: "from-orange-500/10 to-amber-500/10" },
  success: { ring: "#10b981", glow: "rgba(16,185,129,0.2)", text: "#34d399", bg: "from-emerald-500/10 to-green-500/10" },
  error: { ring: "#ef4444", glow: "rgba(239,68,68,0.2)", text: "#f87171", bg: "from-red-500/10 to-rose-500/10" },
};

const STATE_LABELS: Record<AvatarState, string> = {
  idle: "Ready",
  listening: "Listening...",
  thinking: "Thinking...",
  speaking: "Speaking...",
  interrupted: "Interrupted",
  success: "Complete",
  error: "Error",
};

export function VoiceVisualizer({ state, audioLevel = 0, size = 280, className }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  // Live audio level via ref: the rAF loop reads the latest value without
  // the effect (and canvas state) being torn down on every audio tick
  const audioLevelRef = useRef(audioLevel);
  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);
  const colors = STATE_COLORS[state];

  const ringCount = 5;
  const rings = useMemo(() =>
    Array.from({ length: ringCount }, (_, i) => ({
      baseRadius: (size / 2) * (0.35 + i * 0.12),
      phase: i * 0.8,
      speed: 0.8 + i * 0.15,
    })),
    [size]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Reset the canvas bitmap and transform each time so repeated effects
    // don't compound ctx.scale() (which progressively distorted the drawing)
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = size / 2;

    const draw = () => {
      const level = audioLevelRef.current;
      ctx.clearRect(0, 0, size, size);
      const t = performance.now() / 1000;

      // Background glow
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, size / 2);
      gradient.addColorStop(0, colors.glow);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Center circle
      const isActive = state === "speaking" || state === "listening";
      const pulseScale = isActive ? 1 + level * 0.15 : 1;
      const coreRadius = size * 0.18 * pulseScale;

      const coreGrad = ctx.createRadialGradient(center, center, 0, center, center, coreRadius);
      coreGrad.addColorStop(0, colors.ring);
      coreGrad.addColorStop(1, colors.ring + "60");
      ctx.beginPath();
      ctx.arc(center, center, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Inner icon (mic/speaker/etc)
      ctx.fillStyle = "#fff";
      ctx.font = `${size * 0.08}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const icon = state === "listening" ? "🎙" : state === "speaking" ? "🔊" : state === "thinking" ? "⏳" : "🎙";
      ctx.fillText(icon, center, center);

      // Animated rings
      rings.forEach((ring, i) => {
        const amplitude = state === "speaking"
          ? level * size * 0.04
          : state === "listening"
            ? Math.sin(t * 2 + ring.phase) * size * 0.008
            : Math.sin(t * 0.5 + ring.phase) * size * 0.003;

        const radius = ring.baseRadius + amplitude;
        const alpha = 0.15 + (state === "speaking" ? level * 0.4 : 0.1);

        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.strokeStyle = colors.ring + Math.round(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Orbiting dots for speaking state
      if (state === "speaking" || state === "listening") {
        const dotCount = 8;
        for (let i = 0; i < dotCount; i++) {
          const angle = (t * 1.5 + (i / dotCount) * Math.PI * 2) % (Math.PI * 2);
          const orbitRadius = size * 0.4;
          const dx = Math.cos(angle) * orbitRadius;
          const dy = Math.sin(angle) * orbitRadius;
          const dotAlpha = 0.3 + level * 0.5;

          ctx.beginPath();
          ctx.arc(center + dx, center + dy, 2 + level * 3, 0, Math.PI * 2);
          ctx.fillStyle = colors.ring + Math.round(dotAlpha * 255).toString(16).padStart(2, "0");
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [state, colors, rings, size]);

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ""}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="rounded-full"
        />
        {/* State badge */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: colors.ring,
                animation: (state === "speaking" || state === "listening") ? "pulse 1.5s ease-in-out infinite" : "none",
              }}
            />
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              {STATE_LABELS[state]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
