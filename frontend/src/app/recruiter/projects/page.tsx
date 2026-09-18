"use client";

import { motion } from "framer-motion";
import { FolderGit2, Github, CheckCircle2, ExternalLink } from "lucide-react";

const mockProjects = [
  { id: "1", name: "ML Pipeline", candidate: "Rahul Patil", github: "rahul/ml-pipeline", verified: true, techStack: ["Python", "TensorFlow", "Docker"], stars: 12 },
  { id: "2", name: "E-commerce Platform", candidate: "Sneha Kulkarni", github: "sneha/ecommerce", verified: true, techStack: ["React", "Node.js", "PostgreSQL"], stars: 8 },
  { id: "3", name: "Chat Application", candidate: "Priya Sharma", github: "priya/chat-app", verified: false, techStack: ["React", "Socket.io", "Express"], stars: 5 },
];

export default function ProjectsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="mt-1 text-sm text-surface-400">Verify and review candidate projects</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-surface-900/50 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400">
                  <FolderGit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{project.name}</h3>
                  <p className="text-sm text-surface-400">{project.candidate}</p>
                </div>
              </div>
              {project.verified && (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <span key={tech} className="rounded-full bg-surface-800 px-2 py-0.5 text-xs text-surface-300">{tech}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-surface-400">
              <span className="flex items-center gap-1"><Github className="h-3 w-3" />{project.github}</span>
              <span>{project.stars} stars</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
