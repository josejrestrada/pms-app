"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useEmployee } from "@/components/employee-provider";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { listDirectReports } from "@/lib/employees";
import { listReviewsForEmployees } from "@/lib/reviews";
import type { EmployeeRow } from "@/lib/types/employee";
import type { ReviewRow } from "@/lib/types/review";

function statusLabel(status: string) {
  if (status === "self_submitted") {
    return "Self-appraisal submitted";
  }
  if (status === "completed") {
    return "Completed";
  }
  return status;
}

export function ManagerReviewsListPage() {
  const manager = useEmployee();
  const [reports, setReports] = useState<EmployeeRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reportsById = useMemo(() => {
    return new Map(reports.map((report) => [report.id, report]));
  }, [reports]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const directReports = await listDirectReports(manager.id);
      setReports(directReports);
      const rows = await listReviewsForEmployees(
        directReports.map((report) => report.id),
      );
      setReviews(rows);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load team reviews.",
      );
    } finally {
      setLoading(false);
    }
  }, [manager.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Reviews</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Complete reviews after a direct report submits a self-appraisal.
        </p>
      </div>

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

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews to complete"
          description="When a direct report submits a self-appraisal, it will appear here so you can complete the manager review."
          action={{ href: "/manager/goals", label: "Review team goals" }}
        />
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {reviews.map((review) => {
            const report = reportsById.get(review.employee_id);
            return (
              <li
                key={review.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="font-medium">
                    {report?.full_name ?? "Unknown employee"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {statusLabel(review.status)}
                  </p>
                </div>
                <Link
                  href={`/manager/review/${review.id}`}
                  className="shrink-0 text-sm font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                >
                  Open review
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
