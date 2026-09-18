"use client";

import { motion } from "framer-motion";
import {
  Briefcase, Users, Video, CheckCircle2, Clock, TrendingUp,
  Zap, ArrowUpRight, Activity,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Active Jobs", value: "12", icon: Briefcase, change: "+2 this week", color: "text-brand-400" },
  { label: "Total Candidates", value: "148", icon: Users, change: "+23 this month", color: "text-blue-400" },
  { label: "Interviews", value: "89", icon: Video, change: "+15 this week", color: "text-purple-400" },
  { label: "Shortlisted", value: "34", icon: CheckCircle2, change: "38% rate", color: "text-green-400" },
];

const recentActivity = [
  { action: "Interview completed", candidate: "Priya Sharma", job: "Senior React Developer", time: "2 hours ago", score: 82 },
  { action: "New application", candidate: "Rahul Patil", job: "ML Engineer", time: "4 hours ago", score: null },
  { action: "Assessment submitted", candidate: "Amit Deshmukh", job: "Backend Developer", time: "6 hours ago", score: 76 },
  { action: "Project verified", candidate: "Sneha Kulkarni", job: "Full Stack Developer", time: "1 day ago", score: 88 },
  { action: "Interview scheduled", candidate: "Vikram Joshi", job: "DevOps Engineer", time: "1 day ago", score: null },
];

export default function RecruiterDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-surface-400">Welcome back. Here&apos;s your hiring overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-white/10 bg-surface-900/50 p-6"
          >
            <div className="flex items-center justify-between">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <ArrowUpRight className="h-4 w-4 text-surface-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-surface-400">{stat.label}</div>
              <div className="mt-2 text-xs text-surface-500">{stat.change}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-surface-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/recruiter/interviews" className="text-sm text-brand-400 hover:text-brand-300">View all</Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-800/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/10 text-brand-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.candidate}</p>
                    <p className="text-xs text-surface-400">{activity.action} — {activity.job}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.score !== null && (
                    <span className="inline-block rounded-full bg-brand-600/10 px-2 py-0.5 text-xs font-semibold text-brand-400">
                      {activity.score}%
                    </span>
                  )}
                  <p className="mt-1 text-xs text-surface-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/recruiter/jobs" className="flex items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5 transition-colors">
              <Briefcase className="h-4 w-4 text-brand-400" />
              <span className="text-sm text-white">Create New Job</span>
            </Link>
            <Link href="/recruiter/candidates" className="flex items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5 transition-colors">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white">Add Candidate</span>
            </Link>
            <Link href="/recruiter/interviews" className="flex items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5 transition-colors">
              <Video className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-white">Schedule Interview</span>
            </Link>
            <Link href="/recruiter/analytics" className="flex items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5 transition-colors">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-white">View Analytics</span>
            </Link>
          </div>

          <div className="mt-6 rounded-lg bg-brand-600/10 p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-400" />
              <span className="text-sm font-medium text-brand-300">AI Usage</span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">47</span>
                <span className="text-xs text-surface-400">of 200 interviews</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-surface-800">
                <div className="h-2 rounded-full bg-brand-500" style={{ width: "23.5%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
