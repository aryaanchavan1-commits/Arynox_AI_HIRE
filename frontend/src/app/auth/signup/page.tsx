"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, User, Building2, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";

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

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-surface-500 focus:border-indigo-500/60 focus:bg-white/[0.07] focus:outline-none transition-colors";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070d] px-4 noise">
      <div className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-indigo-600/25 blur-[130px] animate-aurora" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[130px] animate-aurora" style={{ animationDelay: "-7s" }} />
      <div className="absolute inset-0 bg-grid-fade" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-glow-sm">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <span className="font-display text-xl font-bold text-white">ARYNOX<span className="text-indigo-400"> AI</span></span>
          </Link>
          <h1 className="mt-6 font-display text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-surface-400">Start hiring smarter with voice AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {(["recruiter", "candidate"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${form.role === r ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-sm" : "text-surface-400 hover:text-white"}`}>
                {r === "recruiter" ? "Recruiter" : "Candidate"}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className={inputCls} required />
            </div>
          </div>
          {form.role === "recruiter" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">Organization</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
                <input type="text" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Company name" className={inputCls} required />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters"
                className={inputCls.replace("pr-4", "pr-10")} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:shadow-glow disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
