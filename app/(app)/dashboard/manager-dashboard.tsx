"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useEmployee } from "@/components/employee-provider";
import {
  cycleProgressStatus,
  teamMemberBadgeLabel,
  type CycleProgressStatus,
} from "@/lib/cycle-status";
import { listDirectReports } from "@/lib/employees";
import { listGoalsForEmployees } from "@/lib/goals";
import { getOpenReviewCycle } from "@/lib/review-cycles";
import { listEmployeeReviewsForCycle } from "@/lib/reviews";
import type { EmployeeRow } from "@/lib/types/employee";
import type { GoalRow } from "@/lib/types/goal";
import type { ReviewRow } from "@/lib/types/review";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";
import { cardFlushClassName } from "@/lib/ui";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { StatusBadge } from "./status-badge";

export function ManagerDashboard() {
  const manager = useEmployee();
  const [cycle, setCycle] = useState<ReviewCycleRow | null>(null);
  const [reports, setReports] = useState<EmployeeRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [openCycle, directReports] = await Promise.all([
        getOpenReviewCycle(),
        listDirectReports(manager.id),
      ]);
      setCycle(openCycle);
      setReports(directReports);

      if (!openCycle) {
        setGoals([]);
        setReviews([]);
        return;
      }

      const ids = directReports.map((report) => report.id);
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
          : "Could not load your team dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [manager.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
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

    return reports.map((report) => {
      const status = cycleProgressStatus(
        goalsByEmployee.get(report.id) ?? [],
        reviewByEmployee.get(report.id) ?? null,
      );
      return {
        report,
        status,
        review: reviewByEmployee.get(report.id) ?? null,
      };
    });
  }, [goals, reports, reviews]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
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

      <p className="text-sm text-slate-600 dark:text-slate-400">
        {cycle
          ? `Team progress for ${cycle.name}.`
          : "No active review cycle. Team actions are locked."}
      </p>

      {!cycle ? (
        <EmptyState
          title="No active review cycle"
          description="Team goal approval and reviews stay locked until HR opens a cycle."
        />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No direct reports"
          description="When HR assigns people to you, they will show up here with goal and review status."
        />
      ) : (
        <ul className={`divide-y divide-slate-100 ${cardFlushClassName} dark:divide-slate-800`}>
          {rows.map(({ report, status, review }) => (
            <li
              key={report.id}
              className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/40"
            >
              <div>
                <p className="font-medium">{report.full_name}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {report.designation}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge label={teamMemberBadgeLabel(status)} />
                <QuickAction status={status} reviewId={review?.id ?? null} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickAction({
  status,
  reviewId,
}: {
  status: CycleProgressStatus;
  reviewId: string | null;
}) {
  if (status === "goals_pending_approval") {
    return (
      <Link
        href="/manager/goals"
        className="text-sm font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
      >
        Approve goals
      </Link>
    );
  }

  if (status === "manager_review_pending" && reviewId) {
    return (
      <Link
        href={`/manager/review/${reviewId}`}
        className="text-sm font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
      >
        Complete review
      </Link>
    );
  }

  return null;
}
