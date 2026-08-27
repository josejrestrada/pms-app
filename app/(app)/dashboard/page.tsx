import type { Metadata } from "next";
import { getCurrentEmployee } from "@/lib/current-employee";

export const metadata: Metadata = {
  title: "Dashboard · Merit",
};

export default async function DashboardPage() {
  const employee = await getCurrentEmployee();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Welcome back, {employee?.full_name}.
      </p>
    </div>
  );
}
