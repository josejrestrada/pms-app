"use client";

import { useEffect, useId, useRef, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { listGoalRatings } from "@/lib/reviews";
import type { EmployeeWithManager } from "@/lib/types/employee";
import type { GoalRow } from "@/lib/types/goal";
import type { GoalRatingRow, ReviewRow } from "@/lib/types/review";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";
import {
  dialogWideClassName,
  secondaryButtonClassName,
} from "@/lib/ui";
import type { HrWorkflowStatus } from "@/lib/cycle-status";
import { hrWorkflowLabel } from "@/lib/cycle-status";

type HrAppraisalModalProps = {
  open: boolean;
  cycle: ReviewCycleRow;
  employee: EmployeeWithManager | null;
  review: ReviewRow | null;
  goals: GoalRow[];
  workflow: HrWorkflowStatus;
  onClose: () => void;
};

export function HrAppraisalModal({
  open,
  cycle,
  employee,
  review,
  goals,
  workflow,
  onClose,
}: HrAppraisalModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [ratings, setRatings] = useState<GoalRatingRow[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !review) {
      setRatings([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingRatings(true);
    setError(null);

    void listGoalRatings(review.id)
      .then((rows) => {
        if (!cancelled) {
          setRatings(rows);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load appraisal ratings.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRatings(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, review]);

  const ratingsByGoal = new Map(
    ratings.map((rating) => [rating.goal_id, rating]),
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={dialogWideClassName}
      onClose={onClose}
    >
      <div className="max-h-[min(80vh,720px)] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {cycle.name} · Read only
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-tight">
              {employee?.full_name ?? "Employee"}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {employee?.designation}
              {employee?.department ? ` · ${employee.department}` : ""}
              {employee?.manager?.full_name
                ? ` · Manager ${employee.manager.full_name}`
                : ""}
            </p>
          </div>
          <StatusBadge label={hrWorkflowLabel(workflow)} />
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Self rating</dt>
            <dd className="mt-1 font-medium">
              {review?.overall_self_rating != null
                ? `${review.overall_self_rating} / 5`
                : "Pending"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">
              Manager rating
            </dt>
            <dd className="mt-1 font-medium">
              {review?.overall_manager_rating != null
                ? `${review.overall_manager_rating} / 5`
                : "Pending"}
            </dd>
          </div>
        </dl>

        {review?.self_summary ? (
          <section className="mt-5">
            <h3 className="text-sm font-medium">Self summary</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
              {review.self_summary}
            </p>
          </section>
        ) : null}

        {review?.manager_summary ? (
          <section className="mt-5">
            <h3 className="text-sm font-medium">Manager summary</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
              {review.manager_summary}
            </p>
          </section>
        ) : null}

        {error ? (
          <p className="mt-5 text-sm text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        ) : null}

        <section className="mt-6">
          <h3 className="text-sm font-medium">Goals</h3>
          {goals.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              No goals recorded for this cycle yet.
            </p>
          ) : loadingRatings && review ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Loading ratings...
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {goals.map((goal) => {
                const rating = ratingsByGoal.get(goal.id);
                return (
                  <li key={goal.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{goal.title}</p>
                      <StatusBadge label={goal.status} />
                    </div>
                    {goal.description ? (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {goal.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {goal.weightage != null
                        ? `Weightage ${goal.weightage}%`
                        : "No weightage"}
                      {rating?.self_rating != null
                        ? ` · Self ${rating.self_rating}/5`
                        : ""}
                      {rating?.manager_rating != null
                        ? ` · Manager ${rating.manager_rating}/5`
                        : ""}
                    </p>
                    {rating?.self_comment ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Self: {rating.self_comment}
                      </p>
                    ) : null}
                    {rating?.manager_comment ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Manager: {rating.manager_comment}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
