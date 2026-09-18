"use client";

import { useState } from "react";
import { User, Github, Globe, Upload } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "Aryan Chavan", title: "AI/ML Engineer", email: "aryan@email.com", phone: "+91 9876543210",
    skills: ["Python", "Machine Learning", "LLM/RAG", "React", "FastAPI"],
    experience: "3 years", education: "B.Tech Computer Science",
    github: "github.com/aryan", portfolio: "aryan.dev", availability: "20 hrs/week",
  });

  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">Profile</h1><p className="mt-1 text-sm text-surface-400">Manage your candidate profile</p></div>
      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium text-surface-300">Name</label><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-surface-300">Professional Title</label><input value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium text-surface-300">Email</label><input value={profile.email} className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-surface-300">Phone</label><input value={profile.phone} className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none" /></div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">CV Upload</h2>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-white/10 p-8 hover:border-brand-500/50 transition-colors cursor-pointer">
            <div className="text-center"><Upload className="mx-auto h-8 w-8 text-surface-500" /><p className="mt-2 text-sm text-surface-400">Upload PDF, DOCX, or TXT</p></div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Links</h2>
          <div className="space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium text-surface-300"><Github className="mr-1 inline h-4 w-4" />GitHub</label><input value={profile.github} className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-surface-300"><Globe className="mr-1 inline h-4 w-4" />Portfolio</label><input value={profile.portfolio} className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none" /></div>
          </div>
        </div>

        <button className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">Save Profile</button>
      </div>
    </div>
  );
}
