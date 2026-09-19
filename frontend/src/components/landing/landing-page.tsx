"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain, Mic, Shield, Github, BarChart3, Globe, Users,
  FileSearch, Zap, ArrowRight, Bot, Code2, Video,
  ChevronRight, Play, Sparkles, Check, Mic2, Eye, Monitor,
} from "lucide-react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/utils";

const Hero3D = dynamic(() => import("./hero-3d").then((m) => m.Hero3D), { ssr: false, loading: () => <div className="h-96" /> });

const features = [
  { icon: Brain, title: "AI Technical Interviews", description: "Adaptive AI that understands your job requirements and evaluates candidates with evidence-based questions.", color: "from-indigo-500 to-purple-500" },
  { icon: Mic, title: "Live Voice Interviewer", description: "Real-time voice interaction with multiple Sarvam AI voices in English, Hindi, and Marathi.", color: "from-violet-500 to-pink-500" },
  { icon: Eye, title: "OpenCV Proctoring", description: "Face detection, gaze tracking, expression analysis, and multi-face detection for fair interviews.", color: "from-amber-500 to-orange-500" },
  { icon: Monitor, title: "Screen Recording", description: "Optional screen capture during interviews to verify candidate work environment.", color: "from-cyan-500 to-blue-500" },
  { icon: Code2, title: "Technical Assessments", description: "AI-generated assessments tailored to your specific job requirements.", color: "from-blue-500 to-cyan-500" },
  { icon: Github, title: "GitHub Verification", description: "Verify candidate contributions and code quality from their GitHub profile.", color: "from-gray-700 to-gray-900" },
  { icon: Mic2, title: "Multi-Voice AI", description: "Choose from 30+ Sarvam AI voices for a personalized interview experience.", color: "from-orange-500 to-amber-500" },
  { icon: Shield, title: "Privacy-Aware Proctoring", description: "Ethical monitoring signals. Never automated hiring decisions.", color: "from-rose-500 to-red-500" },
  { icon: Users, title: "Candidate Profiles", description: "Comprehensive skill profiles with verified assessments.", color: "from-sky-500 to-blue-500" },
];

const steps = [
  { step: "01", title: "Create Interview", description: "Select candidate, configure skills, set language and duration." },
  { step: "02", title: "Share Link", description: "Candidate receives a secure link. No app download needed." },
  { step: "03", title: "AI Conducts Interview", description: "AI avatar asks adaptive questions via voice in real-time." },
  { step: "04", title: "Review Report", description: "AI generates evidence-based report. Human makes the decision." },
];

const pricingPlans = [
  { name: "Free", price: "\u20B90", period: "/month", description: "Try ARYNOX AI HIRE with limited features", features: ["5 AI Interviews", "10 Candidates", "3 Jobs", "Basic Assessments"], cta: "Get Started", popular: false },
  { name: "Starter", price: "\u20B94,999", period: "/month", description: "For small teams", features: ["50 AI Interviews", "100 Candidates", "10 Jobs", "GitHub Verification", "Reports"], cta: "Start Free Trial", popular: false },
  { name: "Growth", price: "\u20B914,999", period: "/month", description: "For growing companies", features: ["200 AI Interviews", "500 Candidates", "50 Jobs", "3D Avatar", "Analytics"], cta: "Start Free Trial", popular: true },
  { name: "Business", price: "\u20B939,999", period: "/month", description: "For established teams", features: ["Unlimited Interviews", "Unlimited Candidates", "Custom Integrations", "SLA"], cta: "Contact Sales", popular: false },
];

const faqs = [
  { q: "How does the AI interviewer work?", a: "Our AI uses Groq-powered LLMs to conduct adaptive technical interviews with contextual, dynamic questions." },
  { q: "Which languages are supported?", a: "English, Hindi, and Marathi. More languages coming based on demand." },
  { q: "How does GitHub verification work?", a: "We analyze repository structure, commit history, code quality, and generate evidence-based questions." },
  { q: "Is candidate data secure?", a: "Yes. We use encrypted storage, data isolation, and never share information between organizations." },
  { q: "Can I try before buying?", a: "Yes! The Free plan lets you run 5 AI interviews at no cost." },
];

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  if (n > 0) return `${n}+`;
  return "0";
}

export function LandingPage() {
  const [stats, setStats] = useState({ interviews: 0, companies: 1, accuracy: 95, languages: 3 });

  useEffect(() => {
    apiFetch("/api/stats").then((r) => r.json()).then((d) => {
      setStats({ interviews: d.interviews || 0, companies: d.companies || 1, accuracy: d.accuracy || 95, languages: d.languages || 3 });
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-brand-100 selection:text-brand-900">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <span className="text-xs font-bold text-white tracking-tight">AI</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">ARYNOX AI HIRE</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
            <Link href="/auth/signup" className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all">Start Hiring</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <Hero3D />
        <div className="relative mx-auto max-w-7xl px-6 text-center z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            AI-Powered Technical Hiring
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-gray-900 md:text-7xl lg:text-8xl leading-[1.05] animate-slide-up">
            Hire the{" "}
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-500 bg-clip-text text-transparent">
              right engineers
            </span>{" "}
            with AI
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Evaluate technical candidates with AI interviews, live voice interaction, and GitHub verification — in English, Hindi, or Marathi.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link href="/auth/signup" className="group flex items-center gap-2 rounded-2xl bg-gray-900 px-8 py-4 text-sm font-semibold text-white hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20">
              Start Hiring Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth/login" className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
              Sign In
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />Free plan</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />5 min setup</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: formatStat(stats.interviews), label: "Interviews Conducted" },
              { value: formatStat(stats.companies), label: "Organizations" },
              { value: `${stats.accuracy}%`, label: "Accuracy Rate" },
              { value: `${stats.languages}`, label: "Languages" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-brand-600">{stat.value}</div>
                <div className="mt-2 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-sm font-semibold text-brand-600 tracking-wide uppercase">Features</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl text-gray-900">Everything you need for AI hiring</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-brand-200 hover:shadow-xl transition-all duration-200">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-brand-600 tracking-wide uppercase">How it Works</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl text-gray-900">Four steps to smarter hiring</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.step} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white text-lg font-bold shadow-lg shadow-brand-500/25">
                  {s.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                )}
                <h3 className="mt-6 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-brand-600 tracking-wide uppercase">Pricing</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl text-gray-900">Simple, transparent pricing</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border p-6 ${plan.popular ? "border-brand-500 bg-white shadow-xl shadow-brand-500/10 ring-1 ring-brand-500" : "border-gray-200 bg-white"}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">Most Popular</div>}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-brand-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${plan.popular ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand-600 tracking-wide uppercase">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-gray-200 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 list-none">
                  {faq.q}
                  <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform shrink-0 ml-4" />
                </summary>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="rounded-3xl bg-gray-900 px-8 py-16 md:px-16 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.3),transparent)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold md:text-4xl">Ready to transform your hiring?</h2>
              <p className="mt-4 text-gray-300 max-w-xl mx-auto">Start with our free plan today.</p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/signup" className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-all shadow-xl">
                  Start Hiring Free
                </Link>
                <Link href="/auth/login" className="rounded-xl border border-white/20 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <span className="text-[10px] font-bold text-white">AI</span>
              </div>
              <span className="font-bold text-gray-900">ARYNOX AI HIRE</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-gray-400">&copy; 2026 ARYNOX Technologies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
