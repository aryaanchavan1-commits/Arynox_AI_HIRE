"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-surface-400">Hiring insights and metrics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          { title: "Applications Over Time", description: "Monthly application trends" },
          { title: "Interview Completion Rate", description: "Interview funnel analysis" },
          { title: "Average Scores by Skill", description: "Technical competency breakdown" },
          { title: "Candidate Sources", description: "Where candidates come from" },
          { title: "Hiring Funnel", description: "From application to hire" },
          { title: "AI Usage & Cost", description: "Token usage and estimated costs" },
        ].map((chart, i) => (
          <motion.div
            key={chart.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-surface-900/50 p-6"
          >
            <h3 className="font-semibold text-white">{chart.title}</h3>
            <p className="mt-1 text-sm text-surface-400">{chart.description}</p>
            <div className="mt-6 flex h-48 items-center justify-center rounded-lg border border-dashed border-white/10">
              <div className="text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-surface-600" />
                <p className="mt-2 text-sm text-surface-500">Chart placeholder</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
