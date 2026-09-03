"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
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

export function AppNav({ employee }: { employee: EmployeeRow }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(employee.role),
  );

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <Link
          href="/dashboard"
          className="shrink-0 text-sm font-semibold tracking-tight"
        >
          Merit
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
                    ? "shrink-0 rounded-md bg-zinc-900 px-2.5 py-1.5 font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "shrink-0 rounded-md px-2.5 py-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm font-medium sm:block">
            {employee.full_name}
          </span>
          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
            {ROLE_LABELS[employee.role]}
          </span>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
