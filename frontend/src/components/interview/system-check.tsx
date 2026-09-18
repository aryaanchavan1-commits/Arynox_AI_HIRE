"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, Loader2, Wifi, Mic, Camera, Monitor,
  Volume2, ArrowRight, RotateCcw,
} from "lucide-react";

interface SystemCheckProps {
  onComplete: () => void;
}

interface CheckItem {
  id: string;
  label: string;
  status: "pending" | "checking" | "passed" | "failed";
  detail?: string;
}

export function SystemCheck({ onComplete }: SystemCheckProps) {
  const [checks, setChecks] = useState<CheckItem[]>([
    { id: "camera", label: "Camera", status: "pending" },
    { id: "microphone", label: "Microphone", status: "pending" },
    { id: "network", label: "Network Connection", status: "pending" },
    { id: "browser", label: "Browser Compatibility", status: "pending" },
    { id: "speaker", label: "Audio Output", status: "pending" },
  ]);

  const allPassed = checks.every((c) => c.status === "passed");
  const anyFailed = checks.some((c) => c.status === "failed");

  useEffect(() => {
    runChecks();
  }, []);

  const updateCheck = (id: string, status: CheckItem["status"], detail?: string) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, detail } : c))
    );
  };

  const runChecks = async () => {
    for (const check of checks) {
      updateCheck(check.id, "checking");
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));

      try {
        switch (check.id) {
          case "camera": {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            stream.getTracks().forEach((t) => t.stop());
            updateCheck("camera", "passed", `${settings.width}x${settings.height}`);
            break;
          }
          case "microphone": {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
            updateCheck("microphone", "passed", "Audio input available");
            break;
          }
          case "network": {
            const start = Date.now();
            await fetch("/api/health", { method: "HEAD" }).catch(() => {});
            const latency = Date.now() - start;
            updateCheck("network", "passed", `${latency}ms latency`);
            break;
          }
          case "browser": {
            const ua = navigator.userAgent;
            const supported = /Chrome|Firefox|Safari|Edge/.test(ua);
            updateCheck("browser", supported ? "passed" : "failed",
              supported ? "Compatible browser" : "Please use Chrome, Firefox, or Edge");
            break;
          }
          case "speaker": {
            const ctx = new AudioContext();
            await ctx.resume();
            ctx.close();
            updateCheck("speaker", "passed", "Audio output available");
            break;
          }
        }
      } catch {
        updateCheck(check.id, "failed", "Access denied or unavailable");
      }
    }
  };

  const retryChecks = () => {
    setChecks((prev) => prev.map((c) => ({ ...c, status: "pending" as const, detail: undefined })));
    runChecks();
  };

  const iconForStatus = (status: CheckItem["status"]) => {
    switch (status) {
      case "checking":
        return <Loader2 className="h-4 w-4 text-brand-500 animate-spin" />;
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const iconForCheck = (id: string) => {
    switch (id) {
      case "camera": return <Camera className="h-4 w-4" />;
      case "microphone": return <Mic className="h-4 w-4" />;
      case "network": return <Wifi className="h-4 w-4" />;
      case "browser": return <Monitor className="h-4 w-4" />;
      case "speaker": return <Volume2 className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">System Check</h1>
          <p className="text-sm text-gray-500 mb-6">Verifying your setup for the interview.</p>

          <div className="space-y-3 mb-6">
            {checks.map((check) => (
              <div
                key={check.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  check.status === "passed"
                    ? "border-green-200 bg-green-50/50"
                    : check.status === "failed"
                    ? "border-red-200 bg-red-50/50"
                    : "border-gray-100"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {iconForCheck(check.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900">{check.label}</span>
                  {check.detail && (
                    <span className="text-xs text-gray-500 ml-2">{check.detail}</span>
                  )}
                </div>
                {iconForStatus(check.status)}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {anyFailed && (
              <button
                onClick={retryChecks}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
            )}
            <button
              onClick={onComplete}
              disabled={!allPassed}
              className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2"
            >
              Enter Interview
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
