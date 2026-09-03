"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEmployee } from "@/components/employee-provider";
import { listDirectReports } from "@/lib/employees";
import {
  approveEmployeeGoals,
  listSubmittedGoalsForEmployees,
  sendBackEmployeeGoals,
} from "@/lib/goals";
import { getOpenReviewCycle } from "@/lib/review-cycles";
import type { EmployeeRow } from "@/lib/types/employee";
import type { GoalRow } from "@/lib/types/goal";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { SendBackModal } from "./send-back-modal";

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function reportStatus(
  goals: GoalRow[],
): "pending" | "approved" | "sent_back" | "awaiting" {
  if (goals.some((goal) => goal.status === "submitted")) {
    return "pending";
  }
  if (goals.some((goal) => goal.status === "sent_back")) {
    return "sent_back";
  }
  if (goals.length > 0 && goals.every((goal) => goal.status === "approved")) {
    return "approved";
  }
  if (goals.some((goal) => goal.status === "approved")) {
    return "approved";
  }
  return "awaiting";
}

function statusLabel(status: string) {
  if (status === "sent_back") {
    return "Sent back";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ManagerGoalsPage() {
  const manager = useEmployee();
  const [openCycle, setOpenCycle] = useState<ReviewCycleRow | null>(null);
  const [reports, setReports] = useState<EmployeeRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingEmployeeId, setActingEmployeeId] = useState<string | null>(null);
  const [sendBackEmployee, setSendBackEmployee] = useState<EmployeeRow | null>(
    null,
  );

  const goalsByEmployee = useMemo(() => {
    const grouped = new Map<string, GoalRow[]>();
    for (const goal of goals) {
      if (!goal.employee_id) {
        continue;
      }
      const existing = grouped.get(goal.employee_id) ?? [];
      existing.push(goal);
      grouped.set(goal.employee_id, existing);
    }
    return grouped;
  }, [goals]);

  const summary = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let sentBack = 0;
    let awaiting = 0;

    for (const report of reports) {
      const status = reportStatus(goalsByEmployee.get(report.id) ?? []);
      if (status === "pending") {
        pending += 1;
      } else if (status === "approved") {
        approved += 1;
      } else if (status === "sent_back") {
        sentBack += 1;
      } else {
        awaiting += 1;
      }
    }

    return { pending, approved, sentBack, awaiting };
  }, [goalsByEmployee, reports]);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const [cycle, directReports] = await Promise.all([
        getOpenReviewCycle(),
        listDirectReports(manager.id),
      ]);
      setOpenCycle(cycle);
      setReports(directReports);

      if (cycle) {
        const rows = await listSubmittedGoalsForEmployees(
          directReports.map((report) => report.id),
          cycle.id,
        );
        setGoals(rows);
      } else {
        setGoals([]);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load team goals.",
      );
    } finally {
      setLoading(false);
    }
  }, [manager.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(employeeId: string) {
    if (!openCycle) {
      return;
    }

    setActingEmployeeId(employeeId);
    setError(null);

    try {
      await approveEmployeeGoals(employeeId, openCycle.id);
      await load(false);
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "Could not approve these goals.",
      );
    } finally {
      setActingEmployeeId(null);
    }
  }

  async function handleSendBack(comment: string) {
    if (!openCycle || !sendBackEmployee) {
      return;
    }

    setActingEmployeeId(sendBackEmployee.id);
    setError(null);

    try {
      await sendBackEmployeeGoals(sendBackEmployee.id, openCycle.id, comment);
      setSendBackEmployee(null);
      await load(false);
    } catch (sendBackError) {
      setError(
        sendBackError instanceof Error
          ? sendBackError.message
          : "Could not send these goals back.",
      );
    } finally {
      setActingEmployeeId(null);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (!openCycle) {
    return (
      <EmptyState
        title="No Active Review Cycle"
        description="Goal review is currently locked. Open the dashboard until HR starts a cycle."
        action={{ href: "/dashboard", label: "Back to dashboard" }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Goals</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review submitted goals for {openCycle.name}.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Pending review" value={summary.pending} />
        <SummaryCard label="Approved" value={summary.approved} />
        <SummaryCard label="Sent back" value={summary.sentBack} />
        <SummaryCard label="Awaiting submission" value={summary.awaiting} />
      </section>

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

      {reports.length === 0 ? (
        <EmptyState
          title="No direct reports"
          description="You do not have anyone assigned to you yet, so there are no goals to approve."
          action={{ href: "/dashboard", label: "Back to dashboard" }}
        />
      ) : (
        <div className="space-y-6">
          {reports.map((report) => {
            const employeeGoals = goalsByEmployee.get(report.id) ?? [];
            const submittedGoals = employeeGoals.filter(
              (goal) => goal.status === "submitted",
            );
            const acting = actingEmployeeId === report.id;
            const teamStatus = reportStatus(employeeGoals);

            return (
              <section
                key={report.id}
                className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {report.full_name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {report.designation} · {statusLabel(teamStatus)}
                    </p>
                  </div>
                  {submittedGoals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={acting}
                        className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        onClick={() => void handleApprove(report.id)}
                      >
                        {acting ? "Updating…" : "Approve Goals"}
                      </button>
                      <button
                        type="button"
                        disabled={acting}
                        className="rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        onClick={() => setSendBackEmployee(report)}
                      >
                        Send Back
                      </button>
                    </div>
                  ) : null}
                </div>

                {employeeGoals.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-zinc-600 dark:text-zinc-400">
                    No submitted goals for this cycle yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {employeeGoals.map((goal) => (
                      <li key={goal.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-medium">{goal.title}</p>
                          <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {statusLabel(goal.status)}
                          </span>
                        </div>
                        {goal.description ? (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {goal.description}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {goal.weightage != null
                            ? `Weightage ${goal.weightage}%`
                            : "No weightage"}
                          {goal.target_date
                            ? ` · Target ${formatDate(goal.target_date)}`
                            : ""}
                        </p>
                        {goal.status === "sent_back" && goal.manager_comment ? (
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Comment: {goal.manager_comment}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <SendBackModal
        open={sendBackEmployee != null}
        employeeName={sendBackEmployee?.full_name ?? ""}
        submitting={
          sendBackEmployee != null && actingEmployeeId === sendBackEmployee.id
        }
        onClose={() => {
          if (!actingEmployeeId) {
            setSendBackEmployee(null);
          }
        }}
        onConfirm={handleSendBack}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
