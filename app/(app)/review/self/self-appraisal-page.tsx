"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useEmployee } from "@/components/employee-provider";
import { listApprovedEmployeeGoals } from "@/lib/goals";
import { getOpenReviewCycle } from "@/lib/review-cycles";
import {
  getEmployeeCycleReview,
  listGoalRatings,
  submitSelfAppraisal,
} from "@/lib/reviews";
import type { GoalRow } from "@/lib/types/goal";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";

const fieldClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400";

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

type GoalFormState = {
  self_comment: string;
  self_rating: string;
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

async function notifyManager() {
  try {
    const response = await fetch("/api/notify-manager", {
      method: "POST",
    });
    if (!response.ok) {
      console.error(
        "notify-manager: request failed",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("notify-manager: request failed", error);
  }
}

export function SelfAppraisalPage() {
  const employee = useEmployee();
  const [openCycle, setOpenCycle] = useState<ReviewCycleRow | null>(null);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [goalForms, setGoalForms] = useState<Record<string, GoalFormState>>(
    {},
  );
  const [overallSelfRating, setOverallSelfRating] = useState("");
  const [selfSummary, setSelfSummary] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cycle = await getOpenReviewCycle();
      setOpenCycle(cycle);

      if (!cycle) {
        setGoals([]);
        return;
      }

      const [approvedGoals, review] = await Promise.all([
        listApprovedEmployeeGoals(employee.id, cycle.id),
        getEmployeeCycleReview(employee.id, cycle.id),
      ]);
      setGoals(approvedGoals);

      const nextForms: Record<string, GoalFormState> = {};
      for (const goal of approvedGoals) {
        nextForms[goal.id] = { self_comment: "", self_rating: "" };
      }

      if (review) {
        setAlreadySubmitted(review.status === "self_submitted");
        setOverallSelfRating(
          review.overall_self_rating != null
            ? String(review.overall_self_rating)
            : "",
        );
        setSelfSummary(review.self_summary ?? "");
        const ratings = await listGoalRatings(review.id);
        for (const rating of ratings) {
          nextForms[rating.goal_id] = {
            self_comment: rating.self_comment ?? "",
            self_rating:
              rating.self_rating != null ? String(rating.self_rating) : "",
          };
        }
      } else {
        setAlreadySubmitted(false);
        setOverallSelfRating("");
        setSelfSummary("");
      }

      setGoalForms(nextForms);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your self-appraisal.",
      );
    } finally {
      setLoading(false);
    }
  }, [employee.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateGoalForm(
    goalId: string,
    field: keyof GoalFormState,
    value: string,
  ) {
    setGoalForms((current) => ({
      ...current,
      [goalId]: {
        self_comment: current[goalId]?.self_comment ?? "",
        self_rating: current[goalId]?.self_rating ?? "",
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!openCycle) {
      return;
    }

    const ratings = [];
    for (const goal of goals) {
      const form = goalForms[goal.id];
      const rating = parseRating(form?.self_rating ?? "");
      const comment = form?.self_comment.trim() ?? "";
      if (!comment || rating === null) {
        setFormError(
          "Each approved goal needs a comment and a rating from 1 to 5.",
        );
        return;
      }
      ratings.push({
        goal_id: goal.id,
        self_comment: comment,
        self_rating: rating,
      });
    }

    const overall = parseRating(overallSelfRating);
    if (overall === null) {
      setFormError("Overall self-rating must be a whole number from 1 to 5.");
      return;
    }

    if (!selfSummary.trim()) {
      setFormError("A summary is required.");
      return;
    }

    setSaving(true);
    setFormError(null);
    setError(null);
    setSuccess(null);

    try {
      await submitSelfAppraisal({
        employee_id: employee.id,
        cycle_id: openCycle.id,
        overall_self_rating: overall,
        self_summary: selfSummary.trim(),
        ratings,
      });
      await notifyManager();
      setAlreadySubmitted(true);
      setSuccess("Self-appraisal submitted. Your manager has been notified.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit your self-appraisal.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!openCycle) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full rounded-xl border border-zinc-200 bg-white px-8 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold tracking-tight">
            No Active Review Cycle
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Self-appraisal is currently locked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Self-Appraisal
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Rate your approved goals for {openCycle.name}.
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

      {goals.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          You have no approved goals for this cycle yet. Self-appraisal opens
          after your manager approves your goals.
        </p>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {goals.map((goal) => (
            <section
              key={goal.id}
              className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-lg font-semibold tracking-tight">
                {goal.title}
              </h2>
              {goal.description ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {goal.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {goal.weightage != null ? `${goal.weightage}%` : "No weightage"}
                {goal.target_date
                  ? ` · Target ${formatDate(goal.target_date)}`
                  : ""}
              </p>

              <label className="mt-5 block text-sm font-medium">
                Self comment
                <textarea
                  required
                  rows={3}
                  className={fieldClassName}
                  value={goalForms[goal.id]?.self_comment ?? ""}
                  onChange={(event) =>
                    updateGoalForm(goal.id, "self_comment", event.target.value)
                  }
                />
              </label>

              <label className="mt-4 block text-sm font-medium">
                Self rating
                <select
                  required
                  className={fieldClassName}
                  value={goalForms[goal.id]?.self_rating ?? ""}
                  onChange={(event) =>
                    updateGoalForm(goal.id, "self_rating", event.target.value)
                  }
                >
                  <option value="">Select 1–5</option>
                  {RATING_OPTIONS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          ))}

          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold tracking-tight">
              Overall assessment
            </h2>

            <label className="mt-5 block text-sm font-medium">
              Overall self-rating
              <select
                required
                className={fieldClassName}
                value={overallSelfRating}
                onChange={(event) => setOverallSelfRating(event.target.value)}
              >
                <option value="">Select 1–5</option>
                {RATING_OPTIONS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium">
              Self summary
              <textarea
                required
                rows={4}
                className={fieldClassName}
                value={selfSummary}
                onChange={(event) => setSelfSummary(event.target.value)}
              />
            </label>

            {formError ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving
                  ? "Submitting…"
                  : alreadySubmitted
                    ? "Update self-appraisal"
                    : "Submit self-appraisal"}
              </button>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
