"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, MapPin, Clock, Users, MoreVertical } from "lucide-react";

const mockJobs = [
  { id: "1", title: "Senior React Developer", department: "Engineering", location: "Pune", workMode: "hybrid", applicants: 23, status: "active", createdAt: "2026-01-10" },
  { id: "2", title: "ML Engineer", department: "AI/ML", location: "Mumbai", workMode: "remote", applicants: 18, status: "active", createdAt: "2026-01-12" },
  { id: "3", title: "Backend Developer", department: "Engineering", location: "Nagpur", workMode: "onsite", applicants: 31, status: "active", createdAt: "2026-01-15" },
  { id: "4", title: "DevOps Engineer", department: "Infrastructure", location: "Remote", workMode: "remote", applicants: 12, status: "closed", createdAt: "2026-01-05" },
];

export default function JobsPage() {
  const [search, setSearch] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="mt-1 text-sm text-surface-400">Manage your job postings</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          <Plus className="h-4 w-4" />
          Create Job
        </button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..."
            className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-surface-500 focus:border-brand-500 focus:outline-none" />
        </div>
      </div>

      <div className="space-y-4">
        {mockJobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-surface-900/50 p-6 hover:border-brand-500/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-surface-400">
                  <span>{job.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                  <span className="rounded-full bg-surface-800 px-2 py-0.5 text-xs">{job.workMode}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applicants} applicants</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.createdAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${job.status === "active" ? "bg-green-500/10 text-green-400" : "bg-surface-700 text-surface-400"}`}>
                  {job.status}
                </span>
                <button className="rounded-lg p-2 text-surface-400 hover:bg-white/5 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
