"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useEmployee } from "@/components/employee-provider";
import { EmptyState, PageSkeleton } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { listDirectReports } from "@/lib/employees";
import { listReviewsForEmployees } from "@/lib/reviews";
import type { EmployeeRow } from "@/lib/types/employee";
import type { ReviewRow } from "@/lib/types/review";
import { cardFlushClassName, textLinkClassName } from "@/lib/ui";

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
      <PageHeader
        title="Team Reviews"
        subtitle="Complete reviews after a direct report submits a self-appraisal."
      />

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

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews to complete"
          description="When a direct report submits a self-appraisal, it will appear here so you can complete the manager review."
          action={{ href: "/manager/goals", label: "Review team goals" }}
        />
      ) : (
        <ul className={`${cardFlushClassName} divide-y divide-slate-100 dark:divide-slate-800`}>
          {reviews.map((review) => {
            const report = reportsById.get(review.employee_id);
            return (
              <li
                key={review.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div>
                  <p className="font-medium">
                    {report?.full_name ?? "Unknown employee"}
                  </p>
                  <div className="mt-2">
                    <StatusBadge label={review.status} />
                  </div>
                </div>
                <Link
                  href={`/manager/review/${review.id}`}
                  className={textLinkClassName}
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
