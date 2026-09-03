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
  { href: "/my-goals", label: "My Goals" },
  { href: "/review/self", label: "My Review" },
  { href: "/my-team", label: "My Team", roles: ["manager"] },
  { href: "/manager/goals", label: "Team Goals", roles: ["manager"] },
  { href: "/admin/employees", label: "Employees", roles: ["hr_admin"] },
  { href: "/admin/cycles", label: "Cycles", roles: ["hr_admin"] },
];

export function AppNav({ employee }: { employee: EmployeeRow }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(employee.role),
  );

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <Link href="/dashboard" className="shrink-0 text-sm font-semibold tracking-tight">
          Merit
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto text-sm">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "shrink-0 font-medium text-zinc-900 dark:text-zinc-50"
                    : "shrink-0 text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-zinc-600 sm:block dark:text-zinc-400">
            {employee.full_name}
          </span>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
