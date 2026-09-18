"use client";

import { FileCheck, Clock, CheckCircle2 } from "lucide-react";

const mockAssessments = [
  { title: "Python Assessment", skill: "Python", score: 90, completed: true, date: "2026-01-10" },
  { title: "ML Assessment", skill: "Machine Learning", score: 82, completed: true, date: "2026-01-12" },
  { title: "React Assessment", skill: "React", score: null, completed: false, date: null },
];

export default function AssessmentsPage() {
  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">Assessments</h1><p className="mt-1 text-sm text-surface-400">Technical assessments you&apos;ve taken</p></div>
      <div className="space-y-4">
        {mockAssessments.map((a, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400"><FileCheck className="h-5 w-5" /></div>
              <div>
                <h3 className="font-semibold text-white">{a.title}</h3>
                <p className="text-sm text-surface-400">{a.skill}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {a.completed ? (
                <><span className="text-xl font-bold text-white">{a.score}%</span>
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400"><CheckCircle2 className="h-3 w-3" /> Completed</span></>
              ) : (
                <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Take Now</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
