"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, User, Building2, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "recruiter" as "recruiter" | "candidate", organization: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      window.location.href = form.role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <span className="text-xl font-bold text-white">ARYNOX AI HIRE</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-surface-400">Start hiring smarter with AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-surface-900/50 p-8">
          <div className="flex gap-2 rounded-lg border border-white/10 p-1">
            {(["recruiter", "candidate"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${form.role === r ? "bg-brand-600 text-white" : "text-surface-400 hover:text-white"}`}>
                {r === "recruiter" ? "Recruiter" : "Candidate"}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-surface-500 focus:border-brand-500 focus:outline-none" required />
            </div>
          </div>
          {form.role === "recruiter" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">Organization</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
                <input type="text" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Company name"
                  className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-surface-500 focus:border-brand-500 focus:outline-none" required />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com"
                className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-surface-500 focus:border-brand-500 focus:outline-none" required />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters"
                className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-surface-500 focus:border-brand-500 focus:outline-none" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
