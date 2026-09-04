"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useEmployee } from "@/components/employee-provider";
import {
  cycleProgressStatus,
  employeeReviewBadgeLabel,
} from "@/lib/cycle-status";
import { listEmployeeGoals } from "@/lib/goals";
import { getOpenReviewCycle } from "@/lib/review-cycles";
import { getEmployeeCycleReview } from "@/lib/reviews";
import type { GoalRow } from "@/lib/types/goal";
import type { ReviewRow } from "@/lib/types/review";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { cardClassName, primaryButtonClassName, secondaryButtonClassName } from "@/lib/ui";
import { StatusBadge } from "./status-badge";

const actionClassName = primaryButtonClassName;
const secondaryActionClassName = secondaryButtonClassName;

export function EmployeeDashboard() {
  const employee = useEmployee();
  const [cycle, setCycle] = useState<ReviewCycleRow | null>(null);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [review, setReview] = useState<ReviewRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const openCycle = await getOpenReviewCycle();
      setCycle(openCycle);
      if (!openCycle) {
        setGoals([]);
        setReview(null);
        return;
      }

      const [goalRows, reviewRow] = await Promise.all([
        listEmployeeGoals(employee.id, openCycle.id),
        getEmployeeCycleReview(employee.id, openCycle.id),
      ]);
      setGoals(goalRows);
      setReview(reviewRow);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [employee.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <PageSkeleton />;
  }

  const status = cycleProgressStatus(goals, review);
  const badge = employeeReviewBadgeLabel(status);

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

      <section className={cardClassName}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Active cycle
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {cycle?.name ?? "No active cycle"}
          </h2>
          <StatusBadge label={badge} />
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {cycle
            ? "Your review status for this cycle."
            : "Goal setting and self-appraisal are locked until HR opens a cycle."}
        </p>
      </section>

      {cycle ? (
        <section className="flex flex-wrap gap-3">
          {badge === "Not Started" ? (
            <Link href="/goals" className={actionClassName}>
              Set Goals
            </Link>
          ) : (
            <Link href="/goals" className={secondaryActionClassName}>
              View Goals
            </Link>
          )}
          {badge === "Self-Appraisal Pending" ? (
            <Link href="/review/self" className={actionClassName}>
              Complete Self-Appraisal
            </Link>
          ) : badge === "Completed" ? (
            <Link href="/review/self" className={secondaryActionClassName}>
              View Self-Appraisal
            </Link>
          ) : null}
        </section>
      ) : (
        <EmptyState
          title="No active review cycle"
          description="Goal setting and self-appraisal stay locked until HR opens a cycle."
        />
      )}
    </div>
  );
}
