"use client";

import { motion } from "framer-motion";
import { FileCheck, Plus, Clock, Users } from "lucide-react";

const mockAssessments = [
  { id: "1", title: "React Technical Assessment", skills: ["React", "TypeScript", "Hooks"], questions: 25, duration: 60, attempts: 34 },
  { id: "2", title: "Python ML Assessment", skills: ["Python", "TensorFlow", "Scikit-learn"], questions: 20, duration: 45, attempts: 21 },
  { id: "3", title: "System Design Assessment", skills: ["System Design", "Architecture"], questions: 5, duration: 90, attempts: 15 },
];

export default function AssessmentsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Assessments</h1>
          <p className="mt-1 text-sm text-surface-400">Create and manage technical assessments</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          <Plus className="h-4 w-4" />
          Create Assessment
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockAssessments.map((assessment, i) => (
          <motion.div
            key={assessment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-surface-900/50 p-6 hover:border-brand-500/30 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-white">{assessment.title}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {assessment.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-surface-800 px-2 py-0.5 text-xs text-surface-300">{skill}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-surface-400">
              <span>{assessment.questions} questions</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{assessment.duration} min</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{assessment.attempts}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
