"use client";

import { motion } from "framer-motion";
import { Shield, Users, Briefcase, Video, Activity, Database, AlertTriangle } from "lucide-react";

const stats = [
  { label: "Organizations", value: "24", icon: Users, color: "text-brand-400" },
  { label: "Total Users", value: "312", icon: Users, color: "text-blue-400" },
  { label: "Active Jobs", value: "89", icon: Briefcase, color: "text-purple-400" },
  { label: "Interviews Today", value: "47", icon: Video, color: "text-green-400" },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-brand-400" />
          <div>
            <h1 className="text-2xl font-bold">Platform Admin</h1>
            <p className="text-sm text-surface-400">ARYNOX AI HIRE administration</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div className="mt-4 text-3xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-surface-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <h2 className="text-lg font-semibold mb-4">Provider Status</h2>
            <div className="space-y-3">
              {[
                { name: "Groq LLM", status: "configured", color: "bg-green-400" },
                { name: "Supabase", status: "configured", color: "bg-green-400" },
                { name: "Razorpay", status: "not configured", color: "bg-yellow-400" },
                { name: "GitHub OAuth", status: "not configured", color: "bg-yellow-400" },
                { name: "Resend Email", status: "not configured", color: "bg-yellow-400" },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-800/30 p-3">
                  <span className="text-sm text-surface-300">{p.name}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${p.color}`} />
                    <span className="text-surface-400">{p.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <h2 className="text-lg font-semibold mb-4">System Health</h2>
            <div className="space-y-3">
              {[
                { label: "API Response Time", value: "45ms", status: "healthy" },
                { label: "Database", value: "Connected", status: "healthy" },
                { label: "WebSocket", value: "Active", status: "healthy" },
                { label: "Storage", value: "2.3 GB / 10 GB", status: "healthy" },
                { label: "Error Rate", value: "0.02%", status: "healthy" },
              ].map((h) => (
                <div key={h.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-800/30 p-3">
                  <span className="text-sm text-surface-300">{h.label}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-surface-400">{h.value}</span>
                    <span className={`h-2 w-2 rounded-full ${h.status === "healthy" ? "bg-green-400" : "bg-red-400"}`} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
