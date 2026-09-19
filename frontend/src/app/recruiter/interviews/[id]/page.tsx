"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bot, User, Clock, Calendar, CheckCircle2,
  BarChart3, MessageSquare, AlertTriangle, Copy, ExternalLink,
  Loader2, Download,
} from "lucide-react";
import { apiFetch } from "@/lib/utils";

interface InterviewDetail {
  id: string;
  status: string;
  language: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  invitation_token: string | null;
  evaluation: any | null;
  candidates: { name: string; email: string } | null;
  jobs: { title: string; required_skills: string[] } | null;
}

interface Event {
  id: string;
  event_type: string;
  payload: any;
  timestamp: string;
}

export default function RecruiterInterviewDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInterview();
      fetchEvents();
    }
  }, [id]);

  const fetchInterview = async () => {
    try {
      const res = await apiFetch(`/api/interviews/${id}`);
      const data = await res.json();
      setInterview(data);
    } catch {}
  };

  const fetchEvents = async () => {
    try {
      const res = await apiFetch(`/api/interviews/${id}/events`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {}
    setLoading(false);
  };

  const copyLink = () => {
    if (!interview?.invitation_token) return;
    navigator.clipboard.writeText(`${window.location.origin}/interview/${interview.invitation_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-50 text-blue-700 border-blue-200";
      case "in_progress": return "bg-amber-50 text-amber-700 border-amber-200";
      case "completed": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Interview not found</p>
      </div>
    );
  }

  const questions = events.filter((e) => e.event_type === "question");
  const answers = events.filter((e) => e.event_type === "answer");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <Link href="/recruiter/interviews" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Interviews
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 font-semibold">
                {interview.candidates?.name?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{interview.candidates?.name || "Unknown"}</h1>
                <p className="text-sm text-gray-500">{interview.candidates?.email} — {interview.jobs?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusColor(interview.status)}`}>
                {interview.status === "in_progress" && <Loader2 className="h-3 w-3 animate-spin" />}
                {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
              </span>
              {interview.invitation_token && (
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy Link"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
          {[
            { label: "Questions Asked", value: questions.length, icon: MessageSquare },
            { label: "Answers Given", value: answers.length, icon: CheckCircle2 },
            { label: "Language", value: interview.language.toUpperCase(), icon: Bot },
            { label: "Duration", value: interview.completed_at && interview.started_at
              ? `${Math.round((new Date(interview.completed_at).getTime() - new Date(interview.started_at).getTime()) / 60000)}m`
              : interview.started_at ? "In progress" : "Not started", icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Evaluation */}
        {interview.evaluation && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Evaluation Report</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
              {[
                { label: "Technical", score: interview.evaluation.technical_score },
                { label: "Communication", score: interview.evaluation.communication_score },
                { label: "Problem Solving", score: interview.evaluation.problem_solving_score },
                { label: "Project Understanding", score: interview.evaluation.project_understanding_score },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="relative h-16 w-16 mx-auto mb-2">
                    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${item.score}, 100`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">{item.score}</span>
                  </div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            {interview.evaluation.strengths?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Strengths</h3>
                <div className="flex flex-wrap gap-2">
                  {interview.evaluation.strengths.map((s: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {interview.evaluation.improvements?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Areas for Improvement</h3>
                <div className="flex flex-wrap gap-2">
                  {interview.evaluation.improvements.map((s: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {interview.evaluation.summary && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{interview.evaluation.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Transcript</h2>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No transcript available yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className={`flex gap-3 ${event.event_type === "answer" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    event.event_type === "answer" ? "bg-gray-100 text-gray-600" : "bg-brand-100 text-brand-600"
                  }`}>
                    {event.event_type === "answer" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    event.event_type === "answer"
                      ? "bg-gray-100 text-gray-700 rounded-tr-md"
                      : "bg-brand-50 text-gray-700 rounded-tl-md border border-brand-100"
                  }`}>
                    <p className="text-sm leading-relaxed">{event.payload.question || event.payload.answer}</p>
                    {event.payload.skill && (
                      <span className="inline-block mt-1 text-xs text-brand-600 font-medium">{event.payload.skill}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
