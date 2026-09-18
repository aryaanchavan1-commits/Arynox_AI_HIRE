"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      window.location.href = "/recruiter/dashboard";
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">ARYNOX AI HIRE</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-surface-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-surface-900/50 p-8">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
                className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-surface-500 focus:border-brand-500 focus:outline-none" required />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password"
                className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-surface-500 focus:border-brand-500 focus:outline-none" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface-900 px-2 text-surface-500">or continue with</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="rounded-lg border border-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-colors">Google</button>
            <button type="button" className="rounded-lg border border-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-colors">GitHub</button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
