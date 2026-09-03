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
import { StatusBadge } from "./status-badge";

const actionClassName =
  "inline-flex items-center justify-center rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";

const secondaryActionClassName =
  "inline-flex items-center justify-center rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

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
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  const status = cycleProgressStatus(goals, review);
  const badge = employeeReviewBadgeLabel(status);

  return (
    <div className="space-y-6">
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

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Active cycle
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {cycle?.name ?? "No active cycle"}
          </h2>
          <StatusBadge label={badge} />
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
      ) : null}
    </div>
  );
}
