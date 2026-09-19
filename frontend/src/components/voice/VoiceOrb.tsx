"use client";

import { useRef, useEffect, useState } from "react";
import { Mic, AudioLines } from "lucide-react";

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking" | "complete" | "error";

interface VoiceOrbProps {
  state: VoiceOrbState;
  audioLevel?: number;          // 0-1 mic/input level
  isMuted?: boolean;            // shows mic-off styling while listening
  size?: number;                // box size in px
  className?: string;
}

const STATE_THEME: Record<VoiceOrbState, { a: string; b: string; glow: string; label: string }> = {
  idle:      { a: "#6366f1", b: "#a855f7", glow: "99,102,241",  label: "Ready when you are" },
  listening: { a: "#10b981", b: "#22d3ee", glow: "16,185,129",  label: "Listening…" },
  thinking:  { a: "#f59e0b", b: "#f97316", glow: "245,158,11",  label: "Thinking…" },
  speaking:  { a: "#6366f1", b: "#ec4899", glow: "139,92,246",  label: "AI is speaking" },
  complete:  { a: "#22c55e", b: "#14b8a6", glow: "34,197,94",   label: "Interview complete" },
  error:     { a: "#ef4444", b: "#f43f5e", glow: "239,68,68",   label: "Something went wrong" },
};

/**
 * VoiceOrb — the voice-first "AI speaking box".
 * A glassy 3D orb with reactive equalizer bars, orbiting particles and a soft
 * glow that pulses with the actual audio level. Canvas-rendered at 60fps.
 */
export function VoiceOrb({ state, audioLevel = 0, isMuted = false, size = 320, className }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const levelRef = useRef(audioLevel);
  const stateRef = useRef(state);
  const themeRef = useRef(STATE_THEME[state]);
  const [label, setLabel] = useState(STATE_THEME[state].label);

  useEffect(() => { levelRef.current = audioLevel; }, [audioLevel]);
  useEffect(() => {
    stateRef.current = state;
    themeRef.current = STATE_THEME[state];
    setLabel(STATE_THEME[state].label);
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = size / 2;
    let t = 0;

    const draw = () => {
      t += 0.016;
      const theme = themeRef.current;
      const st = stateRef.current;
      const level = levelRef.current;

      ctx.clearRect(0, 0, size, size);

      // ---- ambient glow ----
      const breathe = 1 + Math.sin(t * 1.2) * 0.04 + (st === "speaking" ? level * 0.25 : st === "listening" ? level * 0.18 : 0);
      const glowR = size * 0.48 * breathe;
      const glow = ctx.createRadialGradient(center, center, size * 0.1, center, center, glowR);
      glow.addColorStop(0, `rgba(${theme.glow},${0.32 + level * 0.25})`);
      glow.addColorStop(0.6, `rgba(${theme.glow},0.10)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // ---- glass outer ring (3D feel: two arcs with light source top-left) ----
      const ringR = size * 0.36;
      ctx.lineWidth = size * 0.012;
      const ringGrad = ctx.createLinearGradient(center - ringR, center - ringR, center + ringR, center + ringR);
      ringGrad.addColorStop(0, "rgba(255,255,255,0.85)");
      ringGrad.addColorStop(0.5, `rgba(${theme.glow},0.35)`);
      ringGrad.addColorStop(1, "rgba(255,255,255,0.12)");
      ctx.strokeStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(center, center, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // ---- orbiting particles ----
      const particleCount = st === "speaking" ? 10 : st === "listening" || st === "thinking" ? 6 : 4;
      const orbitSpeed = st === "thinking" ? 2.2 : st === "speaking" ? 1.4 + level * 2 : 0.5;
      for (let i = 0; i < particleCount; i++) {
        const angle = t * orbitSpeed + (i / particleCount) * Math.PI * 2;
        const rr = ringR + Math.sin(t * 2 + i) * 4;
        const px = center + Math.cos(angle) * rr;
        const py = center + Math.sin(angle) * rr;
        ctx.beginPath();
        ctx.arc(px, py, 2.2 + level * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${theme.glow},${0.5 + level * 0.4})`;
        ctx.fill();
      }

      // ---- inner orb (3D sphere shading) ----
      const coreR = size * 0.22 * (1 + (st === "speaking" ? level * 0.12 : 0));
      const coreGrad = ctx.createRadialGradient(
        center - coreR * 0.35, center - coreR * 0.4, coreR * 0.1,
        center, center, coreR
      );
      coreGrad.addColorStop(0, theme.a);
      coreGrad.addColorStop(0.7, theme.b);
      coreGrad.addColorStop(1, `rgba(${theme.glow},0.55)`);
      ctx.beginPath();
      ctx.arc(center, center, coreR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // highlight for glossy 3D look
      ctx.beginPath();
      ctx.ellipse(center - coreR * 0.32, center - coreR * 0.42, coreR * 0.28, coreR * 0.18, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fill();

      // ---- equalizer bars around the bottom arc ----
      const bars = 28;
      const baseR = size * 0.27;
      for (let i = 0; i < bars; i++) {
        const angle = Math.PI * 0.75 + (i / (bars - 1)) * Math.PI * 1.5; // arc across the bottom
        const wave =
          st === "speaking" ? Math.abs(Math.sin(t * 6 + i * 0.7)) * (0.35 + level * 0.9)
          : st === "listening" ? Math.abs(Math.sin(t * 4 + i * 0.9)) * (0.1 + level * 0.7)
          : st === "thinking" ? Math.abs(Math.sin(t * 3 + i * 0.5)) * 0.16
          : Math.abs(Math.sin(t + i * 0.4)) * 0.06;
        const len = size * 0.02 + wave * size * 0.075;
        const x1 = center + Math.cos(angle) * baseR;
        const y1 = center + Math.sin(angle) * baseR;
        const x2 = center + Math.cos(angle) * (baseR + len);
        const y2 = center + Math.sin(angle) * (baseR + len);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = size * 0.008;
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(${theme.glow},${0.35 + wave})`;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [size]);

  const mutedRing = isMuted && state === "listening";

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ""}`}>
      <div
        className="relative rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_-20px_rgba(99,102,241,0.45)] backdrop-blur-xl"
        style={{ width: size + 48, height: size + 48, padding: 24 }}
      >
        {/* corner accents for the "box" feel */}
        <div className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-white/5" />
        <canvas ref={canvasRef} style={{ width: size, height: size }} className="rounded-full" />
        <div className="absolute left-1/2 top-5 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 backdrop-blur-md">
            {mutedRing ? (
              <Mic className="h-3 w-3 text-red-400" />
            ) : (
              <AudioLines className="h-3 w-3" style={{ color: themeRef.current.a }} />
            )}
            <span className="text-xs font-medium tracking-wide text-white/90">{mutedRing ? "Muted" : label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
