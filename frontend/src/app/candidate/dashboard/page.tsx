"use client";

import { motion } from "framer-motion";
import { User, Video, FileCheck, FolderGit2, Star, Clock } from "lucide-react";
import Link from "next/link";

export default function CandidateDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Candidate Dashboard</h1>
        <p className="mt-1 text-sm text-surface-400">Your career profile and interview progress</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/10 text-brand-400 text-xl font-bold">AC</div>
              <div>
                <h2 className="text-xl font-bold text-white">Aryan Chavan</h2>
                <p className="text-surface-400">AI/ML Engineer</p>
                <div className="mt-2 flex gap-4 text-sm text-surface-400">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400" />85% avg score</span>
                  <span className="flex items-center gap-1"><Video className="h-3 w-3" />5 interviews</span>
                  <span className="flex items-center gap-1"><FolderGit2 className="h-3 w-3" />3 projects</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <h3 className="font-semibold text-white mb-4">Skills</h3>
            <div className="space-y-3">
              {[
                { skill: "Python", level: 90 },
                { skill: "Machine Learning", level: 82 },
                { skill: "LLM/RAG", level: 91 },
                { skill: "React", level: 80 },
                { skill: "FastAPI", level: 74 },
              ].map((s) => (
                <div key={s.skill}>
                  <div className="flex justify-between text-sm"><span className="text-surface-300">{s.skill}</span><span className="text-brand-400">{s.level}%</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-800"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${s.level}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/candidate/profile" className="flex items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5 transition-colors"><User className="h-4 w-4 text-brand-400" /><span className="text-sm text-white">Edit Profile</span></Link>
              <Link href="/candidate/projects" className="flex items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5 transition-colors"><FolderGit2 className="h-4 w-4 text-blue-400" /><span className="text-sm text-white">Add Project</span></Link>
              <Link href="/candidate/interviews" className="flex items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5 transition-colors"><Video className="h-4 w-4 text-purple-400" /><span className="text-sm text-white">View Interviews</span></Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { action: "Interview completed", time: "2 days ago", score: 85 },
                { action: "Project verified", time: "5 days ago", score: null },
                { action: "Assessment passed", time: "1 week ago", score: 78 },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div><p className="text-surface-300">{a.action}</p><p className="text-xs text-surface-500">{a.time}</p></div>
                  {a.score && <span className="rounded-full bg-brand-600/10 px-2 py-0.5 text-xs text-brand-400">{a.score}%</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
