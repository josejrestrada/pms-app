"use client";

import { useEmployee } from "@/components/employee-provider";
import { EmployeeDashboard } from "./employee-dashboard";
import { HrAdminDashboard } from "./hr-admin-dashboard";
import { ManagerDashboard } from "./manager-dashboard";

export function DashboardPage() {
  const employee = useEmployee();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Welcome back, {employee.full_name}.
        </p>
      </div>

      {employee.role === "hr_admin" ? (
        <HrAdminDashboard />
      ) : employee.role === "manager" ? (
        <ManagerDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}
