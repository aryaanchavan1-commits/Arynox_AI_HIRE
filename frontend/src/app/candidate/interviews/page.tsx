"use client";

import { Video, Clock, CheckCircle2, Calendar } from "lucide-react";

const mockInterviews = [
  { job: "AI Engineer", date: "2026-01-18", status: "completed", score: 85, duration: "45 min" },
  { job: "ML Engineer", date: "2026-01-15", status: "completed", score: 78, duration: "30 min" },
  { job: "Full Stack Developer", date: "2026-01-22", status: "scheduled", score: null, duration: "—" },
];

export default function InterviewsPage() {
  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">My Interviews</h1><p className="mt-1 text-sm text-surface-400">Track your interview history</p></div>
      <div className="space-y-4">
        {mockInterviews.map((interview, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${interview.status === "completed" ? "bg-green-500/10" : "bg-blue-500/10"}`}>
                {interview.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Calendar className="h-5 w-5 text-blue-400" />}
              </div>
              <div>
                <h3 className="font-semibold text-white">{interview.job}</h3>
                <p className="text-sm text-surface-400">{interview.date} — {interview.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {interview.score && <span className="text-xl font-bold text-white">{interview.score}%</span>}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${interview.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>
                {interview.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
