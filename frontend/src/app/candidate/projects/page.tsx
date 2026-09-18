"use client";

import { FolderGit2, Github, CheckCircle2 } from "lucide-react";

const mockProjects = [
  { name: "ML Pipeline", github: "aryan/ml-pipeline", verified: true, techStack: ["Python", "TensorFlow", "Docker"], description: "End-to-end ML pipeline for fraud detection" },
  { name: "RAG Chatbot", github: "aryan/rag-chatbot", verified: true, techStack: ["FastAPI", "LangChain", "Pinecone"], description: "RAG-based customer support chatbot" },
  { name: "E-commerce App", github: "aryan/ecommerce", verified: false, techStack: ["React", "Node.js", "Stripe"], description: "Full-stack e-commerce platform" },
];

export default function ProjectsPage() {
  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">My Projects</h1><p className="mt-1 text-sm text-surface-400">Your verified and unverified projects</p></div>
      <div className="space-y-4">
        {mockProjects.map((project, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400"><FolderGit2 className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold text-white">{project.name}</h3>
                  <p className="text-sm text-surface-400">{project.description}</p>
                </div>
              </div>
              {project.verified && <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400"><CheckCircle2 className="h-3 w-3" /> Verified</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.techStack.map((t) => (<span key={t} className="rounded-full bg-surface-800 px-2 py-0.5 text-xs text-surface-300">{t}</span>))}
            </div>
            <div className="mt-3 text-sm text-surface-400"><Github className="mr-1 inline h-3 w-3" />{project.github}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
