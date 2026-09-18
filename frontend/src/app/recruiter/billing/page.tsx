"use client";

import { motion } from "framer-motion";
import { CreditCard, CheckCircle2 } from "lucide-react";

const plans = [
  { name: "Free", price: "\u20B90", features: ["5 Interviews", "10 Candidates", "3 Jobs"], current: true },
  { name: "Starter", price: "\u20B94,999/mo", features: ["50 Interviews", "100 Candidates", "10 Jobs", "GitHub Verification"] },
  { name: "Growth", price: "\u20B914,999/mo", features: ["200 Interviews", "500 Candidates", "50 Jobs", "Company RAG", "3D Avatar"], popular: true },
  { name: "Business", price: "\u20B939,999/mo", features: ["Unlimited Interviews", "Unlimited Candidates", "Unlimited Jobs", "Custom Integrations"] },
];

export default function BillingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="mt-1 text-sm text-surface-400">Manage your subscription and usage</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Current Usage</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Interviews", used: 5, limit: 5 },
            { label: "Candidates", used: 8, limit: 10 },
            { label: "Jobs", used: 2, limit: 3 },
            { label: "AI Tokens", used: "12.5K", limit: "50K" },
          ].map((u) => (
            <div key={u.label} className="rounded-lg border border-white/5 bg-surface-800/50 p-4">
              <div className="text-sm text-surface-400">{u.label}</div>
              <div className="mt-1 text-xl font-bold text-white">{u.used} <span className="text-sm font-normal text-surface-500">/ {u.limit}</span></div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Plans</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.name} className={`rounded-xl border p-6 ${plan.popular ? "border-brand-500 bg-surface-900" : "border-white/10 bg-surface-900/50"}`}>
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <div className="mt-2 text-2xl font-bold text-white">{plan.price}</div>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-surface-300">
                  <CheckCircle2 className="h-3 w-3 text-brand-400 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button className={`mt-6 w-full rounded-lg py-2 text-sm font-semibold transition-colors ${plan.current ? "bg-surface-700 text-surface-400 cursor-default" : plan.popular ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-white/10 text-white hover:bg-white/5"}`}>
              {plan.current ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
