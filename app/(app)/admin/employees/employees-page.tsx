"use client";

import { useCallback, useEffect, useState } from "react";
import { listEmployees } from "@/lib/employees";
import type { EmployeeRole, EmployeeWithManager } from "@/lib/types/employee";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { AddEmployeeModal } from "./add-employee-modal";
import {
  primaryButtonClassName,
  tableBodyClassName,
  tableHeadRowClassName,
  tableRowClassName,
} from "@/lib/ui";

const ROLE_LABELS: Record<EmployeeRole, string> = {
  hr_admin: "HR Admin",
  manager: "Manager",
  employee: "Employee",
};

function roleLabel(role: EmployeeRole) {
  return ROLE_LABELS[role] ?? role;
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeWithManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchEmployees = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const rows = await listEmployees();
      setEmployees(rows);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load employees.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Employees"
          subtitle="Directory of people in the performance management system."
        />
        <button
          type="button"
          className={primaryButtonClassName}
          onClick={() => setModalOpen(true)}
        >
          Add employee
        </button>
      </div>

        {error ? (
          <div
            className="mt-6 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
            role="alert"
          >
            {error}
            <button
              type="button"
              className="ml-3 font-medium underline"
              onClick={() => void fetchEmployees()}
            >
              Try again
            </button>
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className={tableHeadRowClassName}>
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className={tableBodyClassName}>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="h-4 w-24 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <EmptyState
                      title="No employees yet"
                      description="Add the first person to start building your directory and reporting hierarchy."
                      action={{
                        label: "Add employee",
                        onClick: () => setModalOpen(true),
                      }}
                    />
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className={tableRowClassName}>
                    <td className="px-4 py-3 font-medium">
                      {employee.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {employee.designation}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {employee.department}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {employee.manager?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {roleLabel(employee.role)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={employee.is_active ? "active" : "inactive"}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      <AddEmployeeModal
        open={modalOpen}
        employees={employees}
        onClose={() => setModalOpen(false)}
        onCreated={() => fetchEmployees(false)}
      />
    </>
  );
}
