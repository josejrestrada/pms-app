"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useEmployee } from "@/components/employee-provider";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  cycleProgressStatus,
  hrBucket,
  hrWorkflowLabel,
  hrWorkflowStatus,
  teamMemberBadgeLabel,
  type HrWorkflowStatus,
} from "@/lib/cycle-status";
import { listEmployees } from "@/lib/employees";
import { listGoalsForEmployees } from "@/lib/goals";
import { getOpenReviewCycle } from "@/lib/review-cycles";
import { listEmployeeReviewsForCycle } from "@/lib/reviews";
import type { EmployeeWithManager } from "@/lib/types/employee";
import type { GoalRow } from "@/lib/types/goal";
import type { ReviewRow } from "@/lib/types/review";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";
import {
  cardClassName,
  cardFlushClassName,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  tableBodyClassName,
  tableHeadRowClassName,
  tableRowClassName,
} from "@/lib/ui";
import { HrAppraisalModal } from "./hr-appraisal-modal";

type DepartmentRow = {
  department: string;
  total: number;
  pendingSelf: number;
  pendingManager: number;
  completed: number;
};

type AppraisalRow = {
  employee: EmployeeWithManager;
  label: string;
  bucket: ReturnType<typeof hrBucket>;
  workflow: HrWorkflowStatus;
  review: ReviewRow | null;
  goals: GoalRow[];
};

type MetricAccent = "sky" | "violet" | "indigo";

const METRIC_ACCENT: Record<MetricAccent, string> = {
  sky: "border-l-4 border-l-sky-500 bg-sky-50/70 dark:bg-sky-950/25",
  violet:
    "border-l-4 border-l-violet-500 bg-violet-50/70 dark:bg-violet-950/25",
  indigo:
    "border-l-4 border-l-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/25",
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

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function overallRatingDisplay(review: ReviewRow | null): string {
  if (review?.overall_manager_rating != null) {
    return String(review.overall_manager_rating);
  }
  if (review?.overall_self_rating != null) {
    return String(review.overall_self_rating);
  }
  return "Pending";
}

export function HrAdminDashboard() {
  const viewer = useEmployee();
  const [cycle, setCycle] = useState<ReviewCycleRow | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithManager[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );

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

  const people = useMemo<AppraisalRow[]>(() => {
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
      const employeeGoals = goalsByEmployee.get(employee.id) ?? [];
      const review = reviewByEmployee.get(employee.id) ?? null;
      const progress = cycleProgressStatus(employeeGoals, review);
      const workflow = hrWorkflowStatus(progress);
      return {
        employee,
        label: teamMemberBadgeLabel(progress),
        bucket: hrBucket(progress),
        workflow,
        review,
        goals: employeeGoals,
      };
    });
  }, [employees, goals, reviews]);

  const metrics = useMemo(() => {
    const completed = people.filter((person) => person.bucket === "completed")
      .length;
    const total = people.length;
    const pending = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, rate };
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

  const filteredPeople = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return people;
    }

    return people.filter((person) => {
      const managerName = person.employee.manager?.full_name ?? "";
      return (
        person.employee.full_name.toLowerCase().includes(needle) ||
        person.employee.department.toLowerCase().includes(needle) ||
        managerName.toLowerCase().includes(needle)
      );
    });
  }, [people, query]);

  const selectedRow = useMemo(
    () => people.find((person) => person.employee.id === selectedEmployeeId) ?? null,
    [people, selectedEmployeeId],
  );

  function exportCsv() {
    const header = [
      "Name",
      "Email",
      "Department",
      "Designation",
      "Manager",
      "Cycle",
      "Status",
      "Overall Rating",
    ];
    const lines = [
      header.join(","),
      ...people.map((person) =>
        [
          csvCell(person.employee.full_name),
          csvCell(person.employee.email),
          csvCell(person.employee.department),
          csvCell(person.employee.designation),
          csvCell(person.employee.manager?.full_name ?? ""),
          csvCell(cycle?.name ?? ""),
          csvCell(person.label),
          csvCell(overallRatingDisplay(person.review)),
        ].join(","),
      ),
    ];
    const slug = (cycle?.name ?? "no-cycle").replace(/\s+/g, "-").toLowerCase();
    downloadCsv(`merit-completion-${slug}.csv`, lines);
  }

  async function handleCopySummary() {
    const lines = [
      `Merit appraisal summary${cycle ? ` — ${cycle.name}` : ""}`,
      `Employees: ${metrics.total}`,
      `Completed: ${metrics.completed} (${metrics.rate}%)`,
      `Pending: ${metrics.pending}`,
      "",
      "By department:",
      ...departments.map(
        (row) =>
          `${row.department}: ${row.completed}/${row.total} completed, ${row.pendingSelf} pending self, ${row.pendingManager} pending manager`,
      ),
    ];
    await copyText(lines.join("\n"));
    setCopied("Summary copied");
    window.setTimeout(() => setCopied(null), 2000);
  }

  async function handleQuickNudge() {
    const pending = people.filter((person) => person.workflow !== "completed");
    const lines = [
      `Please complete your ${cycle?.name ?? "current cycle"} appraisal in Merit.`,
      "",
      pending.length === 0
        ? "Everyone in the active cycle is complete."
        : `Pending (${pending.length}):`,
      ...pending.map((person) => {
        const manager = person.employee.manager?.full_name
          ? ` — manager ${person.employee.manager.full_name}`
          : "";
        return `- ${person.employee.full_name} (${person.employee.email}, ${person.employee.department}) [${hrWorkflowLabel(person.workflow)}]${manager}`;
      }),
    ];
    await copyText(lines.join("\n"));
    setCopied(
      pending.length === 0 ? "Completion note copied" : "Nudge list copied",
    );
    window.setTimeout(() => setCopied(null), 2000);
  }

  if (viewer.role !== "hr_admin") {
    return null;
  }

  if (loading) {
    return <PageSkeleton variant="metrics" />;
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div
          className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
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
        <MetricCard
          accent="sky"
          label="Total Employees"
          value={String(metrics.total)}
        />
        <MetricCard
          accent="violet"
          label="Active Cycle"
          value={cycle?.name ?? "None"}
        />
        <MetricCard
          accent="indigo"
          label="Completion Rate"
          value={`${metrics.rate}%`}
        >
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {metrics.completed} completed · {metrics.pending} pending
          </p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            role="progressbar"
            aria-label="Cycle completion rate"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={metrics.rate}
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${metrics.rate}%` }}
            />
          </div>
        </MetricCard>
      </section>

      {!cycle ? (
        <EmptyState
          title="No active review cycle"
          description="Open a cycle so employees can set goals and complete appraisals. Completion rate stays at 0% until a cycle is active."
          action={{ href: "/admin/cycles", label: "Manage cycles" }}
        />
      ) : null}

      <section className={cardFlushClassName}>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <h2 className="text-sm font-semibold tracking-tight">
            Department breakdown
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {copied ? (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {copied}
              </span>
            ) : null}
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => void handleCopySummary()}
            >
              Copy Summary
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => void handleQuickNudge()}
            >
              Quick Nudge
            </button>
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={exportCsv}
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={tableHeadRowClassName}>
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pending Self-Appraisal</th>
                <th className="px-4 py-3">Pending Manager Review</th>
                <th className="px-4 py-3">Completed</th>
              </tr>
            </thead>
            <tbody className={tableBodyClassName}>
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
                  <tr key={row.department} className={tableRowClassName}>
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

      {cycle ? (
        <section className={cardFlushClassName}>
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                All Employee Appraisals (Active Cycle)
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Company-wide read-only view of {cycle.name}.
              </p>
            </div>
            <label className="block text-sm font-medium sm:w-72">
              Search
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name or department"
                className={`${fieldClassName} !mt-1`}
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className={tableHeadRowClassName}>
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Assigned Manager</th>
                  <th className="px-4 py-3">Workflow Status</th>
                  <th className="px-4 py-3">Overall Rating</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className={tableBodyClassName}>
                {filteredPeople.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-400"
                    >
                      No employees match that search.
                    </td>
                  </tr>
                ) : (
                  filteredPeople.map((person) => (
                    <tr key={person.employee.id} className={tableRowClassName}>
                      <td className="px-4 py-3 font-medium">
                        {person.employee.full_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {person.employee.department || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {person.employee.manager?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={hrWorkflowLabel(person.workflow)} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {overallRatingDisplay(person.review)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className={`${secondaryButtonClassName} !px-3 !py-1.5 text-xs`}
                          onClick={() =>
                            setSelectedEmployeeId(person.employee.id)
                          }
                        >
                          View Appraisal
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {cycle ? (
        <HrAppraisalModal
          open={selectedRow != null}
          cycle={cycle}
          employee={selectedRow?.employee ?? null}
          review={selectedRow?.review ?? null}
          goals={selectedRow?.goals ?? []}
          workflow={selectedRow?.workflow ?? "not_started"}
          onClose={() => setSelectedEmployeeId(null)}
        />
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  children,
}: {
  label: string;
  value: string;
  accent: MetricAccent;
  children?: ReactNode;
}) {
  return (
    <div className={`${cardClassName} ${METRIC_ACCENT[accent]} !p-4`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {children}
    </div>
  );
}
