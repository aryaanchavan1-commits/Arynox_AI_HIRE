"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [org, setOrg] = useState({ name: "Arynox Technologies", slug: "arynox", industry: "Technology", size: "50-200" });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-surface-400">Manage your organization settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-surface-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Organization</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">Name</label>
              <input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">Slug</label>
              <input value={org.slug} onChange={(e) => setOrg({ ...org, slug: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-surface-800 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none" />
            </div>
            <button className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
