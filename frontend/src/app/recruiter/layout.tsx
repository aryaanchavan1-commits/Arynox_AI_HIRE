"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Users, Video, FileCheck, FolderGit2,
  FileBarChart, BarChart3, CreditCard, Settings, LogOut, Smile,
} from "lucide-react";

const navItems = [
  { href: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recruiter/jobs", label: "Jobs", icon: Briefcase },
  { href: "/recruiter/candidates", label: "Candidates", icon: Users },
  { href: "/recruiter/interviews", label: "Interviews", icon: Video },
  { href: "/recruiter/avatar", label: "Avatar Preview", icon: Smile },
  { href: "/recruiter/assessments", label: "Assessments", icon: FileCheck },
  { href: "/recruiter/projects", label: "Projects", icon: FolderGit2 },
  { href: "/recruiter/reports", label: "Reports", icon: FileBarChart },
  { href: "/recruiter/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/recruiter/billing", label: "Billing", icon: CreditCard },
  { href: "/recruiter/settings", label: "Settings", icon: Settings },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-surface-950">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-surface-900/50">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-sm font-bold text-white">AI</span>
          </div>
          <span className="text-sm font-bold text-white">ARYNOX AI HIRE</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-600/10 text-brand-400" : "text-surface-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-surface-400 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
