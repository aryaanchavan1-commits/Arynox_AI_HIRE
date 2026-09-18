"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, Search, Filter, Calendar, Clock, Users, BarChart3,
  MoreVertical, Eye, Send, Trash2, CheckCircle2, XCircle,
  Loader2, AlertCircle, Copy, ExternalLink, Bot,
} from "lucide-react";

interface Interview {
  id: string;
  status: string;
  language: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  invitation_token: string | null;
  candidates: { name: string; email: string } | null;
  jobs: { title: string } | null;
  evaluation: any | null;
}

export default function RecruiterInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch("/api/interviews");
      const data = await res.json();
      setInterviews(data.interviews || []);
    } catch {}
    setLoading(false);
  };

  const filtered = interviews.filter((i) => {
    const matchesSearch =
      i.candidates?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.candidates?.email?.toLowerCase().includes(search.toLowerCase()) ||
      i.jobs?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-50 text-blue-700 border-blue-200";
      case "in_progress": return "bg-amber-50 text-amber-700 border-amber-200";
      case "completed": return "bg-green-50 text-green-700 border-green-200";
      case "cancelled": return "bg-gray-50 text-gray-500 border-gray-200";
      default: return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "in_progress": return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      case "completed": return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "cancelled": return <XCircle className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
              <p className="mt-1 text-sm text-gray-500">{interviews.length} total interviews</p>
            </div>
            <Link
              href="/recruiter/interviews/new"
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20"
            >
              <Plus className="h-4 w-4" />
              Schedule Interview
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by candidate or job..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
            {["all", "scheduled", "in_progress", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === s
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s === "all" ? "All" : s === "in_progress" ? "Active" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-500">No interviews found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? "Try a different search" : "Schedule your first interview to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((interview) => (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600 font-semibold text-sm">
                      {interview.candidates?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{interview.candidates?.name || "Unknown"}</h3>
                      <p className="text-xs text-gray-500">{interview.jobs?.title || "No job"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">{new Date(interview.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{new Date(interview.created_at).toLocaleTimeString()}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusColor(interview.status)}`}>
                      {statusIcon(interview.status)}
                      {interview.status === "in_progress" ? "Active" : interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                    </span>

                    <div className="flex items-center gap-1">
                      {interview.invitation_token && (
                        <button
                          onClick={() => copyLink(interview.invitation_token!, interview.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                          title="Copy interview link"
                        >
                          {copiedId === interview.id ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <Link
                        href={`/recruiter/interviews/${interview.id}`}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {interview.status === "in_progress" && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Interview in progress — candidate is active
                  </div>
                )}

                {interview.evaluation && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>Technical: {interview.evaluation.technical_score}/100</span>
                    <span>Communication: {interview.evaluation.communication_score}/100</span>
                    <span>Problem Solving: {interview.evaluation.problem_solving_score}/100</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
