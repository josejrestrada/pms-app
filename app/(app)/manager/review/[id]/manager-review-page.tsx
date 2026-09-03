"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useEmployee } from "@/components/employee-provider";
import { findEmployeeById } from "@/lib/employees";
import { listApprovedEmployeeGoals } from "@/lib/goals";
import { getReviewCycleById } from "@/lib/review-cycles";
import {
  completeManagerReview,
  getReviewById,
  listGoalRatings,
} from "@/lib/reviews";
import type { EmployeeRow } from "@/lib/types/employee";
import type { GoalRow } from "@/lib/types/goal";
import type { GoalRatingRow, ReviewRow } from "@/lib/types/review";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";

const fieldClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400";

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

type ManagerFormState = {
  manager_comment: string;
  manager_rating: string;
};

function parseRating(value: string): number | null {
  if (!/^[1-5]$/.test(value)) {
    return null;
  }

  return Number(value);
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ManagerReviewPage({ reviewId }: { reviewId: string }) {
  const manager = useEmployee();
  const [review, setReview] = useState<ReviewRow | null>(null);
  const [report, setReport] = useState<EmployeeRow | null>(null);
  const [cycle, setCycle] = useState<ReviewCycleRow | null>(null);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [ratings, setRatings] = useState<GoalRatingRow[]>([]);
  const [forms, setForms] = useState<Record<string, ManagerFormState>>({});
  const [overallManagerRating, setOverallManagerRating] = useState("");
  const [managerSummary, setManagerSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    setForbidden(false);

    try {
      const row = await getReviewById(reviewId);
      if (!row) {
        setReview(null);
        return;
      }

      const employee = await findEmployeeById(row.employee_id);
      if (!employee || employee.manager_id !== manager.id) {
        setForbidden(true);
        setReview(null);
        return;
      }

      const [cycleRow, approvedGoals, goalRatings] = await Promise.all([
        getReviewCycleById(row.cycle_id),
        listApprovedEmployeeGoals(row.employee_id, row.cycle_id),
        listGoalRatings(row.id),
      ]);

      const nextForms: Record<string, ManagerFormState> = {};
      for (const rating of goalRatings) {
        nextForms[rating.id] = {
          manager_comment: rating.manager_comment ?? "",
          manager_rating:
            rating.manager_rating != null ? String(rating.manager_rating) : "",
        };
      }

      setReview(row);
      setReport(employee);
      setCycle(cycleRow);
      setGoals(approvedGoals);
      setRatings(goalRatings);
      setForms(nextForms);
      setOverallManagerRating(
        row.overall_manager_rating != null
          ? String(row.overall_manager_rating)
          : "",
      );
      setManagerSummary(row.manager_summary ?? "");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load this review.",
      );
    } finally {
      setLoading(false);
    }
  }, [manager.id, reviewId]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateForm(
    ratingId: string,
    field: keyof ManagerFormState,
    value: string,
  ) {
    setForms((current) => ({
      ...current,
      [ratingId]: {
        manager_comment: current[ratingId]?.manager_comment ?? "",
        manager_rating: current[ratingId]?.manager_rating ?? "",
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review) {
      return;
    }

    const nextRatings = [];
    for (const rating of ratings) {
      const form = forms[rating.id];
      const managerRating = parseRating(form?.manager_rating ?? "");
      const comment = form?.manager_comment.trim() ?? "";
      if (!comment || managerRating === null) {
        setFormError(
          "Each goal needs a manager comment and a rating from 1 to 5.",
        );
        return;
      }
      nextRatings.push({
        id: rating.id,
        manager_comment: comment,
        manager_rating: managerRating,
      });
    }

    const overall = parseRating(overallManagerRating);
    if (overall === null) {
      setFormError("Overall manager rating must be a whole number from 1 to 5.");
      return;
    }

    if (!managerSummary.trim()) {
      setFormError("A manager summary is required.");
      return;
    }

    setSaving(true);
    setFormError(null);
    setError(null);
    setSuccess(null);

    try {
      await completeManagerReview({
        review_id: review.id,
        overall_manager_rating: overall,
        manager_summary: managerSummary.trim(),
        ratings: nextRatings,
      });
      setSuccess("Review completed.");
      await load(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not complete this review.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">
          Review not available
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          You can only complete reviews for your direct reports.
        </p>
        <Link
          href="/manager/review"
          className="mt-4 inline-block text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to team reviews
        </Link>
      </div>
    );
  }

  if (!review || !report) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">
          Review not found
        </h1>
        <Link
          href="/manager/review"
          className="mt-4 inline-block text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to team reviews
        </Link>
      </div>
    );
  }

  const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
  const canComplete =
    review.status === "self_submitted" || review.status === "completed";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {cycle?.name ?? "Review"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Review {report.full_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {report.designation} · {review.status.replace("_", " ")}
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

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {success}
        </div>
      ) : null}

      {!canComplete ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-6 py-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          This review is not ready. The employee must submit a self-appraisal
          first.
        </p>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {ratings.map((rating) => {
            const goal = goalsById.get(rating.goal_id);
            return (
              <section
                key={rating.id}
                className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {goal?.title ?? "Goal"}
                  </h2>
                  {goal?.description ? (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {goal.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {goal?.weightage != null
                      ? `${goal.weightage}%`
                      : "No weightage"}
                    {goal?.target_date
                      ? ` · Target ${formatDate(goal.target_date)}`
                      : ""}
                  </p>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Employee self-appraisal
                    </h3>
                    <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                      {rating.self_comment || "No comment provided."}
                    </p>
                    <p className="mt-3 text-sm font-medium">
                      Self rating: {rating.self_rating ?? "—"} / 5
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Manager evaluation
                    </h3>
                    <label className="mt-3 block text-sm font-medium">
                      Manager comment
                      <textarea
                        required
                        rows={4}
                        className={fieldClassName}
                        value={forms[rating.id]?.manager_comment ?? ""}
                        onChange={(event) =>
                          updateForm(
                            rating.id,
                            "manager_comment",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label className="mt-4 block text-sm font-medium">
                      Manager rating
                      <select
                        required
                        className={fieldClassName}
                        value={forms[rating.id]?.manager_rating ?? ""}
                        onChange={(event) =>
                          updateForm(
                            rating.id,
                            "manager_rating",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">Select 1–5</option>
                        {RATING_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </section>
            );
          })}

          <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold tracking-tight">
                Overall evaluation
              </h2>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Employee self-appraisal
                </h3>
                <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                  {review.self_summary || "No summary provided."}
                </p>
                <p className="mt-3 text-sm font-medium">
                  Overall self-rating: {review.overall_self_rating ?? "—"} / 5
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Manager evaluation
                </h3>
                <label className="mt-3 block text-sm font-medium">
                  Overall manager rating
                  <select
                    required
                    className={fieldClassName}
                    value={overallManagerRating}
                    onChange={(event) =>
                      setOverallManagerRating(event.target.value)
                    }
                  >
                    <option value="">Select 1–5</option>
                    {RATING_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-sm font-medium">
                  Manager summary
                  <textarea
                    required
                    rows={4}
                    className={fieldClassName}
                    value={managerSummary}
                    onChange={(event) => setManagerSummary(event.target.value)}
                  />
                </label>
              </div>
            </div>
          </section>

          {formError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving…" : "Complete Review"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
