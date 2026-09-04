"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import type { EmployeeRole, EmployeeRow } from "@/lib/types/employee";

type NavItem = {
  href: string;
  label: string;
  roles?: EmployeeRole[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/goals", label: "My Goals" },
  { href: "/review/self", label: "My Review" },
  { href: "/my-team", label: "My Team", roles: ["manager"] },
  { href: "/manager/goals", label: "Team Goals", roles: ["manager"] },
  { href: "/manager/review", label: "Team Reviews", roles: ["manager"] },
  { href: "/admin/employees", label: "Employees", roles: ["hr_admin"] },
  { href: "/admin/cycles", label: "Cycles", roles: ["hr_admin"] },
];

const ROLE_LABELS: Record<EmployeeRole, string> = {
  hr_admin: "HR Admin",
  manager: "Manager",
  employee: "Employee",
};

const ROLE_BADGE: Record<EmployeeRole, string> = {
  hr_admin:
    "border-indigo-500/30 bg-indigo-500/15 text-indigo-300",
  manager: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  employee: "border-slate-500/30 bg-slate-500/15 text-slate-300",
};

export function AppNav({ employee }: { employee: EmployeeRow }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(employee.role),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 px-6 py-3.5 text-white backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-[0_0_16px_rgba(79,70,229,0.65)]">
            <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden />
            <span className="absolute inset-0 animate-pulse rounded-lg bg-indigo-400/30" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Merit</span>
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "shrink-0 rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-3 py-1.5 text-sm font-medium text-indigo-400"
                    : "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[employee.role]}`}
          >
            {ROLE_LABELS[employee.role]}
          </span>
          <UserButton
            appearance={{
              elements: { avatarBox: "h-8 w-8" },
            }}
          />
        </div>
      </div>
    </header>
  );
}
