"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain, Mic, Shield, Github, BarChart3, Users,
  Zap, ArrowRight, Bot, Code2, Radio,
  ChevronRight, Sparkles, Check, Mic2, Eye, Monitor, Languages, Play, User,
} from "lucide-react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/utils";

const Hero3D = dynamic(() => import("./hero-3d").then((m) => m.Hero3D), {
  ssr: false,
  loading: () => <div className="absolute inset-0 -z-10" />,
});

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  if (n > 0) return `${n}+`;
  return "0";
}

export function LandingPage() {
  const [stats, setStats] = useState({ interviews: 0, companies: 1, accuracy: 95, languages: 3 });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    apiFetch("/api/stats").then((r) => r.json()).then((d) => {
      setStats({ interviews: d.interviews || 0, companies: d.companies || 1, accuracy: d.accuracy || 95, languages: d.languages || 3 });
    }).catch(() => {});
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#07070d] text-white antialiased noise relative">
      {/* ============ NAV ============ */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-white/5 bg-[#07070d]/80 backdrop-blur-xl" : "bg-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-glow-sm">
              <span className="text-xs font-bold text-white tracking-tight">AI</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight">ARYNOX<span className="text-indigo-400"> AI</span></span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-surface-400 transition-colors hover:text-white">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-surface-400 transition-colors hover:text-white">How it Works</a>
            <a href="#integrity" className="text-sm font-medium text-surface-400 transition-colors hover:text-white">Integrity</a>
            <a href="#pricing" className="text-sm font-medium text-surface-400 transition-colors hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/practice" className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:border-indigo-400/50 hover:bg-indigo-500/10 sm:block">
              <span className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5 text-indigo-400" /> Try Free</span>
            </Link>
            <Link href="/auth/login" className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-glow-sm transition-all hover:opacity-90">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden pb-24 pt-32">
        <Hero3D />
        <div className="absolute inset-0 bg-grid-fade" />
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[140px] animate-aurora" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 -z-10 h-[300px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[120px] animate-aurora" style={{ animationDelay: "-6s" }} />

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
            <Sparkles className="h-4 w-4" />
            Voice-First AI Interviewing
            <span className="mx-1 h-3 w-px bg-indigo-500/40" />
            <span className="text-indigo-200/70">2026</span>
          </div>

          <h1 className="animate-slide-up mx-auto max-w-5xl font-display text-5xl font-bold leading-[1.04] tracking-tight md:text-7xl lg:text-[5.25rem]">
            Hire the{" "}
            <span className="text-aurora">right engineers</span>
            <br />
            with a voice AI
          </h1>

          <p className="animate-slide-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-surface-400" style={{ animationDelay: "0.1s" }}>
            ARYNOX speaks its questions aloud, listens to every answer, adapts in real time,
            and catches cheating with AI proctoring — in English, हिन्दी, or मराठी.
          </p>

          <div className="animate-slide-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ animationDelay: "0.2s" }}>
            <Link href="/auth/signup" className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-sm font-semibold shadow-glow transition-all hover:shadow-glow-lg">
              Start Hiring Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/practice" className="group flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold backdrop-blur transition-all hover:border-indigo-400/50 hover:bg-indigo-500/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20">
                <Play className="h-3 w-3 text-indigo-300" />
              </span>
              Try a Live Demo Interview
            </Link>
          </div>

          <div className="animate-fade-in mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-surface-500" style={{ animationDelay: "0.3s" }}>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />Practice mode is free forever</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />Setup in 5 minutes</span>
          </div>

          {/* Live stats */}
          <div className="animate-fade-in mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 md:grid-cols-4" style={{ animationDelay: "0.4s" }}>
            {[
              { value: formatStat(stats.interviews), label: "Interviews Conducted" },
              { value: formatStat(stats.companies), label: "Organizations" },
              { value: `${stats.accuracy}%`, label: "Accuracy Rate" },
              { value: `${stats.languages}`, label: "Languages" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0a0a14]/90 px-6 py-6 backdrop-blur">
                <div className="font-display text-3xl font-bold text-white">{stat.value}</div>
                <div className="mt-1.5 text-xs text-surface-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES (bento) ============ */}
      <section id="features" className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Features</span>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Everything you need to hire
              <br />
              <span className="text-aurora">without the busywork</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Brain, title: "Adaptive AI Interviewer", description: "Understands your job requirements, references the candidate's CV and GitHub, and adapts difficulty from every answer.", color: "from-indigo-500 to-purple-500", big: true },
              { icon: Mic, title: "Real Voice Conversation", description: "The AI speaks questions aloud via Sarvam AI. Candidates answer by voice with natural barge-in interruption.", color: "from-violet-500 to-pink-500" },
              { icon: Eye, title: "AI Proctoring", description: "Face presence, gaze tracking, multi-face detection, and fatigue signals — analyzed per frame.", color: "from-amber-500 to-orange-500" },
              { icon: Monitor, title: "Screen Integrity AI", description: "Catches screen-reading: text-density spikes, suspicious content, and browser-tab detection while candidates answer.", color: "from-cyan-500 to-blue-500" },
              { icon: Radio, title: "Recruiter Live Monitoring", description: "Watch any running interview with a real-time transcript and integrity feed — or review the recorded session later.", color: "from-rose-500 to-red-500" },
              { icon: Github, title: "GitHub Verification", description: "Verify candidate contributions and code quality straight from their repositories.", color: "from-gray-600 to-gray-900" },
              { icon: Mic2, title: "Practice Mode", description: "Candidates warm up with instant self-service mock interviews — free, no signup, instant AI feedback.", color: "from-orange-500 to-amber-500" },
              { icon: BarChart3, title: "Evidence-Based Reports", description: "Transcript-grounded scoring with strengths, gaps, and an integrity score in every report. Humans make the final call.", color: "from-emerald-500 to-teal-500" },
              { icon: Languages, title: "22+ Indic Languages Ready", description: "English, Hindi, and Marathi today — powered by Sarvam AI's Indic speech stack.", color: "from-sky-500 to-blue-500" },
            ].map((f) => (
              <div
                key={f.title}
                className={`card-premium group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur ${f.big ? "md:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`} />
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} shadow-lg`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="relative border-y border-white/5 bg-white/[0.015] py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">How it Works</span>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">From link to hire in four steps</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Create Interview", description: "Pick a candidate, set skills, language, and duration.", icon: Bot },
              { step: "02", title: "Share the Link", description: "Candidate opens the secure link — lands straight in the voice interview.", icon: Zap },
              { step: "03", title: "AI Conducts It", description: "The AI speaks, listens, interrupts, adapts — while integrity AI watches.", icon: Mic },
              { step: "04", title: "Monitor & Decide", description: "Watch live or review the recording, transcript, and integrity report.", icon: Radio },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < 3 && (
                  <div className="absolute top-7 left-[calc(50%+3rem)] hidden w-[calc(100%-6rem)] border-t-2 border-dashed border-white/10 lg:block" />
                )}
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow-sm">
                  <s.icon className="h-6 w-6 text-white" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0a0a14] text-[10px] font-bold text-indigo-300">{s.step}</span>
                </div>
                <h3 className="mt-6 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INTEGRITY (anti-cheating) ============ */}
      <section id="integrity" className="relative py-28">
        <div className="pointer-events-none absolute right-0 top-24 h-[400px] w-[400px] rounded-full bg-rose-600/10 blur-[130px]" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">Integrity Engine</span>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
                Cheating attempts, <span className="text-aurora">caught in real time</span>
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-surface-400">
                Every session is monitored by a layered integrity engine. Signals are scored, streamed
                live to recruiters, and summarized in the final report — so genuine skills stand out.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Eye, title: "Gaze & Face Tracking", desc: "Face absence, multi-face detection, gaze-away and fatigue — frame by frame." },
                  { icon: Monitor, title: "Screen Reading Detection", desc: "Text-density spikes and suspicious content flag candidates reading answers off-screen." },
                  { icon: Radio, title: "Live Integrity Feed", desc: "Weighted signals stream to the recruiter dashboard with a 0-100 integrity score." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600">
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-surface-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fake integrity feed preview */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-transparent to-rose-500/20 blur-xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a14] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-red-300">LIVE MONITOR</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    <Shield className="h-3 w-3" /> Integrity 92/100
                  </div>
                </div>
                <div className="space-y-3 p-5 text-sm">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"><Bot className="h-3.5 w-3.5" /></div>
                    <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-2.5 text-surface-300">Walk me through the architecture of your most recent project.</div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <div className="max-w-[80%] rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 px-4 py-2.5 text-white">We used a Next.js frontend with a FastAPI backend…</div>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10"><User className="h-3.5 w-3.5" /></div>
                  </div>
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-300">
                    <div className="flex items-center justify-between font-medium"><span>Gaze away from screen</span><span className="opacity-60">14:32</span></div>
                    <p className="mt-1 opacity-80">Candidate looked away 3× while answering — flagged medium.</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 text-xs text-rose-300">
                    <div className="flex items-center justify-between font-medium"><span>High text density on screen</span><span className="opacity-60">14:35</span></div>
                    <p className="mt-1 opacity-80">Screen share shows dense text — possible external notes.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"><Bot className="h-3.5 w-3.5" /></div>
                    <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-2.5 text-surface-300">Interesting. What trade-offs did that choice create?</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="relative border-y border-white/5 bg-white/[0.015] py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Pricing</span>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">Simple, transparent pricing</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Free", price: "₹0", period: "/month", description: "Try ARYNOX with full voice interviews", features: ["5 AI Interviews", "10 Candidates", "3 Jobs", "Practice Mode", "Basic Proctoring"], cta: "Get Started", popular: false },
              { name: "Starter", price: "₹4,999", period: "/month", description: "For small teams hiring weekly", features: ["50 AI Interviews", "100 Candidates", "10 Jobs", "GitHub Verification", "Recorded Reviews"], cta: "Start Free Trial", popular: false },
              { name: "Growth", price: "₹14,999", period: "/month", description: "For companies hiring at scale", features: ["200 AI Interviews", "500 Candidates", "50 Jobs", "Live Monitoring", "Integrity Engine", "Analytics"], cta: "Start Free Trial", popular: true },
              { name: "Business", price: "₹39,999", period: "/month", description: "For established hiring teams", features: ["Unlimited Interviews", "Unlimited Candidates", "Custom Integrations", "Priority Support", "SLA"], cta: "Contact Sales", popular: false },
            ].map((plan) => (
              <div key={plan.name} className={`card-premium relative flex flex-col rounded-3xl border p-7 ${plan.popular
                ? "border-indigo-500/60 bg-gradient-to-b from-indigo-500/[0.08] to-transparent shadow-glow"
                : "border-white/10 bg-white/[0.03]"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1 text-xs font-semibold shadow-glow-sm">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-surface-500">{plan.period}</span>
                </div>
                <p className="mt-3 text-sm text-surface-400">{plan.description}</p>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm text-surface-300">
                      <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-sm hover:shadow-glow"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">FAQ</span>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "How does the AI interviewer conduct interviews?", a: "ARYNOX speaks its questions aloud (Sarvam AI voice), listens to voice answers with automatic transcription, acknowledges responses, and asks adaptive follow-ups — like a real interviewer, available 24/7." },
              { q: "How does it detect cheating?", a: "A layered integrity engine: face presence, gaze tracking, multi-face detection, screen text-density analysis, browser-tab detection, and suspicious-content flags — all weighted into a live integrity score the recruiter sees in real time." },
              { q: "Which languages are supported?", a: "English, Hindi, and Marathi at launch, with 22+ additional Indic languages available through the Sarvam AI speech stack." },
              { q: "Can I watch interviews live?", a: "Yes. The recruiter Live Monitoring dashboard shows any interview in progress with a real-time transcript and integrity feed. Completed interviews can be reviewed afterwards with full transcript and findings." },
              { q: "Can candidates practice before a real interview?", a: "Yes — Practice Mode lets anyone run an instant mock interview (5 questions, instant AI feedback) free and without signup, so candidates arrive warmed up and recruiters get better signal." },
              { q: "Is candidate data secure?", a: "Yes. Data is isolated per organization, consent is collected before every interview, and proctoring is privacy-aware — signals, not surveillance. Never automated hiring decisions." },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-base font-medium">
                  {faq.q}
                  <ChevronRight className="h-5 w-5 shrink-0 text-surface-500 transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-surface-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-indigo-600/15 via-transparent to-fuchsia-600/10 px-8 py-20 text-center md:px-16">
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-[120px]" />
            <div className="relative">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow">
                <Code2 className="h-7 w-7 text-white" />
              </div>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Ready to transform your hiring?</h2>
              <p className="mx-auto mt-4 max-w-xl text-surface-400">
                Run your first voice AI interview in minutes — or take a practice interview yourself right now.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth/signup" className="rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-[#07070d] shadow-xl transition-all hover:bg-surface-200">
                  Start Hiring Free
                </Link>
                <Link href="/practice" className="flex items-center gap-2 rounded-2xl border border-white/20 px-8 py-4 text-sm font-semibold transition-all hover:bg-white/10">
                  <Mic className="h-4 w-4" />
                  Try the AI Interviewer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <span className="text-[10px] font-bold text-white">AI</span>
              </div>
              <span className="font-display font-bold">ARYNOX Technologies</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-surface-500">
              <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
              <Link href="/practice" className="transition-colors hover:text-white">Practice</Link>
            </div>
            <p className="text-sm text-surface-600">© 2026 ARYNOX Technologies</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
