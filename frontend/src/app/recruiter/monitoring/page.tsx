"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Radio, ShieldAlert, ShieldCheck, Loader2, ArrowLeft,
  Bot, User, RefreshCw, Activity,
} from "lucide-react";
import { apiFetch, API_URL } from "@/lib/utils";

interface LiveInterview {
  id: string;
  status: string;
  recording_status?: string;
  integrity_score?: number;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  started_at?: string;
}

interface TranscriptItem {
  role: "ai" | "candidate";
  text: string;
  timestamp: string;
}

interface IntegritySignal {
  event: string;
  details?: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

export default function LiveMonitoringPage() {
  const [interviews, setInterviews] = useState<LiveInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LiveInterview | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [signals, setSignals] = useState<IntegritySignal[]>([]);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const fetchInterviews = async () => {
    try {
      const res = await apiFetch("/api/interviews");
      const data = await res.json();
      setInterviews(data.interviews || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchInterviews();
    const t = setInterval(fetchInterviews, 15000); // refresh list periodically
    return () => clearInterval(t);
  }, []);

  // Live WebSocket feed for the selected interview
  useEffect(() => {
    if (!selected) return;
    setTranscript([]);
    setSignals([]);

    const wsBase = API_URL.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsBase}/ws/monitor/${selected.id}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "monitor_transcript") {
          setTranscript((prev) => [...prev, msg.payload]);
        } else if (msg.type === "integrity") {
          setSignals((prev) => [...prev, msg.payload]);
        } else if (msg.type === "monitor_status" && msg.payload?.status === "completed") {
          setTranscript((prev) => [...prev, { role: "ai", text: "— Interview completed —", timestamp: new Date().toISOString() }]);
        }
      } catch {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [selected?.id]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  const inProgress = interviews.filter((i) => i.status === "in_progress");
  const recent = interviews.filter((i) => i.status !== "in_progress").slice(0, 8);

  if (selected) {
    const highCount = signals.filter((s) => s.severity === "high").length;
    return (
      <div>
        <button onClick={() => setSelected(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All interviews
        </button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{selected.candidate_name || "Candidate"}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                connected ? "bg-red-500/15 text-red-300" : "bg-white/5 text-surface-400"
              }`}>
                <Radio className={`h-3 w-3 ${connected ? "animate-pulse" : ""}`} />
                {connected ? "LIVE" : "Offline / recorded"}
              </span>
            </div>
            <p className="mt-1 text-sm text-surface-400">{selected.job_title || "Interview"}</p>
          </div>
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2 ${
            highCount > 0 ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"
          }`}>
            {highCount > 0
              ? <ShieldAlert className="h-5 w-5 text-red-400" />
              : <ShieldCheck className="h-5 w-5 text-emerald-400" />}
            <div>
              <div className="text-sm font-semibold text-white">{highCount > 0 ? `${highCount} high alert${highCount > 1 ? "s" : ""}` : "Integrity healthy"}</div>
              <div className="text-xs text-surface-400">{signals.length} total signal{signals.length === 1 ? "" : "s"}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live transcript */}
          <div className="rounded-2xl border border-white/10 bg-surface-900/50 lg:col-span-2">
            <div className="border-b border-white/5 px-5 py-3">
              <h2 className="text-sm font-semibold text-white">Live Transcript</h2>
            </div>
            <div ref={transcriptRef} className="h-[520px] space-y-4 overflow-y-auto p-5">
              {transcript.length === 0 && (
                <p className="mt-10 text-center text-xs text-surface-500">
                  {connected ? "Waiting for conversation…" : "No transcript events replayed."}
                </p>
              )}
              {transcript.map((item, i) => (
                <div key={i} className={`flex gap-3 ${item.role === "candidate" ? "justify-end" : ""}`}>
                  {item.role === "ai" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    item.role === "ai" ? "border border-white/5 bg-white/5 text-surface-200" : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                  }`}>
                    {item.text}
                  </div>
                  {item.role === "candidate" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <User className="h-3.5 w-3.5 text-surface-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Integrity feed */}
          <div className="rounded-2xl border border-white/10 bg-surface-900/50">
            <div className="border-b border-white/5 px-5 py-3">
              <h2 className="text-sm font-semibold text-white">Integrity Feed</h2>
            </div>
            <div className="h-[520px] space-y-3 overflow-y-auto p-5">
              {signals.length === 0 ? (
                <p className="mt-10 text-center text-xs text-surface-500">No signals detected.</p>
              ) : (
                signals.slice().reverse().map((s, i) => (
                  <div key={i} className={`rounded-xl border p-3 text-xs ${
                    s.severity === "high" ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : s.severity === "medium" ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-white/10 bg-white/5 text-surface-300"
                  }`}>
                    <div className="flex items-center justify-between font-medium">
                      <span>{s.event.replace(/_/g, " ")}</span>
                      <span className="opacity-60">{new Date(s.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {s.details && <p className="mt-1 opacity-80">{s.details}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Monitoring</h1>
          <p className="mt-1 text-sm text-surface-400">Watch interviews in progress with real-time integrity signals.</p>
        </div>
        <button onClick={fetchInterviews} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /></div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              In progress ({inProgress.length})
            </h2>
            {inProgress.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-surface-500">
                No interviews are running right now. This view auto-updates every 15 seconds.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {inProgress.map((i) => (
                  <motion.button
                    key={i.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelected(i)}
                    className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-left transition-all hover:border-red-500/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-sm font-bold text-white">
                          {(i.candidate_name || "?").charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{i.candidate_name || "Candidate"}</div>
                          <div className="text-xs text-surface-400">{i.job_title || "Interview"}</div>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
                        <Radio className="h-3 w-3 animate-pulse" /> LIVE
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-surface-400">
                      <Activity className="h-3.5 w-3.5" />
                      Started {i.started_at ? new Date(i.started_at).toLocaleTimeString() : "recently"}
                      {typeof i.integrity_score === "number" && (
                        <span className={i.integrity_score >= 80 ? "text-emerald-400" : "text-amber-400"}>
                          · Integrity {i.integrity_score}/100
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-white">Recent interviews</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {recent.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelected(i)}
                  className="rounded-2xl border border-white/10 bg-surface-900/50 p-4 text-left transition-all hover:border-white/25"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-surface-300">
                        {(i.candidate_name || "?").charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{i.candidate_name || "Candidate"}</div>
                        <div className="text-xs text-surface-400">{i.job_title || "Interview"}</div>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs ${
                      i.status === "completed" ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-surface-400"
                    }`}>
                      {i.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
