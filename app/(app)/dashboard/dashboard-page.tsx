"use client";

import { useEmployee } from "@/components/employee-provider";
import { EmployeeDashboard } from "./employee-dashboard";
import { HrAdminDashboard } from "./hr-admin-dashboard";
import { ManagerDashboard } from "./manager-dashboard";
import { PageHeader } from "@/components/page-header";
import { UnauthorizedAlert } from "./unauthorized-alert";

export function DashboardPage({ unauthorized }: { unauthorized: boolean }) {
  const employee = useEmployee();

  return (
    <div className="space-y-6">
      <UnauthorizedAlert show={unauthorized} />
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${employee.full_name}.`}
      />

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
