"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Bot, User, Briefcase, Globe, Clock, Send,
  CheckCircle2, Loader2, Copy,
} from "lucide-react";

interface Candidate { id: string; name: string; email: string; }
interface Job { id: string; title: string; }

export default function NewInterviewPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; invitation_token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    candidateId: "",
    jobId: "",
    language: "en" as "en" | "hi" | "mr",
    type: "comprehensive" as "technical" | "project_defense" | "hr" | "comprehensive",
    maxDurationMinutes: 60,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/candidates").then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
    ]).then(([c, j]) => {
      setCandidates(c.candidates || []);
      setJobs(j.jobs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setCreated(data);
    } catch {}
    setCreating(false);
  };

  const copyLink = () => {
    if (!created?.invitation_token) return;
    navigator.clipboard.writeText(`${window.location.origin}/interview/${created.invitation_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (created) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Interview Scheduled</h1>
            <p className="mt-2 text-sm text-gray-500">Share this link with the candidate.</p>

            <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/interview/${created.invitation_token}`}
                  className="flex-1 bg-transparent text-sm text-gray-600 focus:outline-none"
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-all"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                href="/recruiter/interviews"
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all text-center"
              >
                View All Interviews
              </Link>
              <button
                onClick={() => { setCreated(null); setForm({ candidateId: "", jobId: "", language: "en", type: "comprehensive", maxDurationMinutes: 60 }); }}
                className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all"
              >
                Schedule Another
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/recruiter/interviews" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Schedule AI Interview</h1>
          <p className="mt-1 text-sm text-gray-500">Configure and launch an AI interview for a candidate.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Candidate */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              Candidate
            </h2>
            <select
              value={form.candidateId}
              onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Select a candidate</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          {/* Job */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              Position
            </h2>
            <select
              value={form.jobId}
              onChange={(e) => setForm({ ...form, jobId: e.target.value })}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Select a job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          {/* Settings */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 text-gray-400" />
              Interview Settings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value as any })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Interview Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="comprehensive">Comprehensive</option>
                  <option value="technical">Technical Only</option>
                  <option value="project_defense">Project Defense</option>
                  <option value="hr">HR/Cultural</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Duration: {form.maxDurationMinutes} minutes
                </label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={form.maxDurationMinutes}
                  onChange={(e) => setForm({ ...form, maxDurationMinutes: Number(e.target.value) })}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>15 min</span>
                  <span>120 min</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!form.candidateId || !form.jobId || creating}
            className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Interview...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Create Interview & Generate Link
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
