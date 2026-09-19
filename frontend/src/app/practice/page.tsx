"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Languages, Briefcase, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/utils";

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
  { id: "mr", label: "मराठी" },
];

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Manual QA Engineer",
  "General Software Engineer",
];

export default function PracticePage() {
  const [role, setRole] = useState(ROLES[0]);
  const [customRole, setCustomRole] = useState("");
  const [language, setLanguage] = useState("en");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const startPractice = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await apiFetch("/api/interviews/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, role: customRole.trim() || role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not start practice interview");
      }
      const data = await res.json();
      // The practice link behaves exactly like a real interview link:
      // opens the voice interview directly.
      window.location.href = data.practiceUrl;
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setStarting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070d] p-4 text-white noise">
      <div className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-indigo-600/25 blur-[130px] animate-aurora" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[130px] animate-aurora" style={{ animationDelay: "-7s" }} />
      <div className="absolute inset-0 bg-grid-fade" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Practice Interview</h1>
              <p className="text-sm text-surface-400">Test the AI interviewer — free, instant, no signup</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-medium text-surface-400">
                <Briefcase className="h-3.5 w-3.5" /> What role are you practicing for?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setCustomRole(""); }}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                      role === r && !customRole
                        ? "border-indigo-500 bg-indigo-500/15 text-white"
                        : "border-white/10 bg-white/5 text-surface-300 hover:border-white/25"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="…or type a custom role"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-medium text-surface-400">
                <Languages className="h-3.5 w-3.5" /> Interview language
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      language === l.id
                        ? "border-indigo-500 bg-indigo-500/15 text-white"
                        : "border-white/10 bg-white/5 text-surface-300 hover:border-white/25"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-surface-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              Practice interviews are not shared with any recruiter. You&apos;ll get instant AI feedback and a score at the end.
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
            )}

            <button
              onClick={startPractice}
              disabled={starting}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-4 text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-50"
            >
              {starting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting your interview…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Start Voice Interview
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
