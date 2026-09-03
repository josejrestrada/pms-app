"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listEmployees } from "@/lib/employees";
import { listGoalsForEmployees } from "@/lib/goals";
import { getOpenReviewCycle } from "@/lib/review-cycles";
import { listEmployeeReviewsForCycle } from "@/lib/reviews";
import {
  cycleProgressStatus,
  hrBucket,
  teamMemberBadgeLabel,
} from "@/lib/cycle-status";
import type { EmployeeRow } from "@/lib/types/employee";
import type { GoalRow } from "@/lib/types/goal";
import type { ReviewRow } from "@/lib/types/review";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";
import { EmptyState, PageSkeleton } from "@/components/empty-state";

type DepartmentRow = {
  department: string;
  total: number;
  pendingSelf: number;
  pendingManager: number;
  completed: number;
};

type PersonStatus = {
  employee: EmployeeRow;
  label: string;
  bucket: ReturnType<typeof hrBucket>;
};

function csvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, lines: string[]) {
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function HrAdminDashboard() {
  const [cycle, setCycle] = useState<ReviewCycleRow | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [openCycle, allEmployees] = await Promise.all([
        getOpenReviewCycle(),
        listEmployees(),
      ]);
      const active = allEmployees.filter((employee) => employee.is_active);
      setCycle(openCycle);
      setEmployees(active);

      if (!openCycle) {
        setGoals([]);
        setReviews([]);
        return;
      }

      const ids = active.map((employee) => employee.id);
      const [goalRows, reviewRows] = await Promise.all([
        listGoalsForEmployees(ids, openCycle.id),
        listEmployeeReviewsForCycle(ids, openCycle.id),
      ]);
      setGoals(goalRows);
      setReviews(reviewRows);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load company metrics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const people = useMemo<PersonStatus[]>(() => {
    const goalsByEmployee = new Map<string, GoalRow[]>();
    for (const goal of goals) {
      if (!goal.employee_id) {
        continue;
      }
      const existing = goalsByEmployee.get(goal.employee_id) ?? [];
      existing.push(goal);
      goalsByEmployee.set(goal.employee_id, existing);
    }

    const reviewByEmployee = new Map(
      reviews.map((review) => [review.employee_id, review]),
    );

    return employees.map((employee) => {
      const status = cycleProgressStatus(
        goalsByEmployee.get(employee.id) ?? [],
        reviewByEmployee.get(employee.id) ?? null,
      );
      return {
        employee,
        label: teamMemberBadgeLabel(status),
        bucket: hrBucket(status),
      };
    });
  }, [employees, goals, reviews]);

  const metrics = useMemo(() => {
    const completed = people.filter((person) => person.bucket === "completed")
      .length;
    const total = people.length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, rate };
  }, [people]);

  const departments = useMemo<DepartmentRow[]>(() => {
    const grouped = new Map<string, DepartmentRow>();

    for (const person of people) {
      const key = person.employee.department || "Unassigned";
      const current = grouped.get(key) ?? {
        department: key,
        total: 0,
        pendingSelf: 0,
        pendingManager: 0,
        completed: 0,
      };
      current.total += 1;
      if (person.bucket === "completed") {
        current.completed += 1;
      } else if (person.bucket === "pending_manager") {
        current.pendingManager += 1;
      } else {
        current.pendingSelf += 1;
      }
      grouped.set(key, current);
    }

    return [...grouped.values()].sort((a, b) =>
      a.department.localeCompare(b.department),
    );
  }, [people]);

  function exportCsv() {
    const header = [
      "Name",
      "Email",
      "Department",
      "Designation",
      "Cycle",
      "Status",
    ];
    const lines = [
      header.join(","),
      ...people.map((person) =>
        [
          csvCell(person.employee.full_name),
          csvCell(person.employee.email),
          csvCell(person.employee.department),
          csvCell(person.employee.designation),
          csvCell(cycle?.name ?? ""),
          csvCell(person.label),
        ].join(","),
      ),
    ];
    const slug = (cycle?.name ?? "no-cycle").replace(/\s+/g, "-").toLowerCase();
    downloadCsv(`merit-completion-${slug}.csv`, lines);
  }

  if (loading) {
    return <PageSkeleton variant="metrics" />;
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="ml-3 font-medium underline"
            onClick={() => void load()}
          >
            Try again
          </button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Total Employees" value={String(metrics.total)} />
        <MetricCard label="Active Cycle" value={cycle?.name ?? "None"} />
        <MetricCard label="Completion Rate" value={`${metrics.rate}%`} />
      </section>

      {!cycle ? (
        <EmptyState
          title="No active review cycle"
          description="Open a cycle so employees can set goals and complete appraisals. Completion rate stays at 0% until a cycle is active."
          action={{ href: "/admin/cycles", label: "Manage cycles" }}
        />
      ) : null}

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold tracking-tight">
            Department breakdown
          </h2>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            onClick={exportCsv}
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Pending Self-Appraisal</th>
                <th className="px-4 py-3 font-medium">Pending Manager Review</th>
                <th className="px-4 py-3 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10">
                    <EmptyState
                      title="No employees yet"
                      description="Add people in the employee directory so cycle completion can be tracked by department."
                      action={{ href: "/admin/employees", label: "Add employees" }}
                    />
                  </td>
                </tr>
              ) : (
                departments.map((row) => (
                  <tr key={row.department}>
                    <td className="px-4 py-3 font-medium">{row.department}</td>
                    <td className="px-4 py-3">{row.total}</td>
                    <td className="px-4 py-3">{row.pendingSelf}</td>
                    <td className="px-4 py-3">{row.pendingManager}</td>
                    <td className="px-4 py-3">{row.completed}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
