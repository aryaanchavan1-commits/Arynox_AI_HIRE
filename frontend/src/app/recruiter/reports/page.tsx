"use client";

import { motion } from "framer-motion";
import { FileBarChart, Download, Eye } from "lucide-react";

const mockReports = [
  { id: "1", candidate: "Priya Sharma", job: "Senior React Developer", overallScore: 82, date: "2026-01-18", status: "ready" },
  { id: "2", candidate: "Sneha Kulkarni", job: "Full Stack Developer", overallScore: 88, date: "2026-01-17", status: "ready" },
  { id: "3", candidate: "Amit Deshmukh", job: "Backend Developer", overallScore: 76, date: "2026-01-19", status: "processing" },
];

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="mt-1 text-sm text-surface-400">AI-generated interview reports</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6 mb-6">
        <p className="text-sm text-surface-400">
          All reports are AI-generated assessments. <span className="text-brand-400">Human review is required before making hiring decisions.</span>
        </p>
      </div>

      <div className="space-y-4">
        {mockReports.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-900/50 p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400">
                <FileBarChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{report.candidate}</h3>
                <p className="text-sm text-surface-400">{report.job} — {report.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-white">{report.overallScore}%</span>
              <div className="flex gap-2">
                <button className="rounded-lg border border-white/10 p-2 text-surface-400 hover:bg-white/5 hover:text-white">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-white/10 p-2 text-surface-400 hover:bg-white/5 hover:text-white">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
