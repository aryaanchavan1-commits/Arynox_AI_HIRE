"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Star, Github, Mail, MoreVertical } from "lucide-react";

const mockCandidates = [
  { id: "1", name: "Priya Sharma", email: "priya@email.com", title: "Senior React Developer", skills: ["React", "TypeScript", "Node.js"], score: 82, github: "priya-sharma" },
  { id: "2", name: "Rahul Patil", email: "rahul@email.com", title: "ML Engineer", skills: ["Python", "TensorFlow", "PyTorch"], score: 78, github: "rahul-patil" },
  { id: "3", name: "Amit Deshmukh", email: "amit@email.com", title: "Backend Developer", skills: ["Node.js", "PostgreSQL", "Docker"], score: 76, github: "amit-d" },
  { id: "4", name: "Sneha Kulkarni", email: "sneha@email.com", title: "Full Stack Developer", skills: ["React", "Python", "FastAPI"], score: 88, github: "sneha-k" },
];

export default function CandidatesPage() {
  const [search, setSearch] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidates</h1>
          <p className="mt-1 text-sm text-surface-400">Manage your candidate pipeline</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Candidate
        </button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates by name, skill, or email..."
            className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-surface-500 focus:border-brand-500 focus:outline-none" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockCandidates.map((candidate, i) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-surface-900/50 p-6 hover:border-brand-500/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-brand-400 text-sm font-bold">
                  {candidate.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{candidate.name}</h3>
                  <p className="text-sm text-surface-400">{candidate.title}</p>
                </div>
              </div>
              <button className="rounded-lg p-2 text-surface-400 hover:bg-white/5 hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-surface-800 px-2.5 py-0.5 text-xs text-surface-300">{skill}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-surface-400">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{candidate.email}</span>
                <span className="flex items-center gap-1"><Github className="h-3 w-3" />{candidate.github}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400" />
                <span className="text-sm font-semibold text-white">{candidate.score}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
