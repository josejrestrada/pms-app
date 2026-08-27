"use client";

import { useCallback, useEffect, useState } from "react";
import { listEmployees } from "@/lib/employees";
import type { EmployeeRole, EmployeeWithManager } from "@/lib/types/employee";
import { AddEmployeeModal } from "./add-employee-modal";

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
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Directory of people in the performance management system.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            onClick={() => setModalOpen(true)}
          >
            Add employee
          </button>
        </div>

        {error ? (
          <div
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
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

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Manager</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="h-4 w-24 max-w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="font-medium">No employees yet</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Add the first person to start building your directory.
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 font-medium">
                      {employee.full_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {employee.designation}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {employee.department}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {employee.manager?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {roleLabel(employee.role)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          employee.is_active
                            ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                            : "bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400"
                        }`}
                      >
                        {employee.is_active ? "Active" : "Inactive"}
                      </span>
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
