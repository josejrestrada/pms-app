"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useEmployee } from "@/components/employee-provider";
import {
  createGoal,
  listEmployeeGoals,
  submitDraftGoals,
  updateGoal,
} from "@/lib/goals";
import { getOpenReviewCycle } from "@/lib/review-cycles";
import type { GoalRow } from "@/lib/types/goal";
import type { ReviewCycleRow } from "@/lib/types/review-cycle";

const fieldClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400";

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function todayDateInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function parseWeightage(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    return null;
  }

  return parsed;
}

export function GoalsPage() {
  const employee = useEmployee();
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [openCycle, setOpenCycle] = useState<ReviewCycleRow | null>(null);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weightage, setWeightage] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);

  const totalWeightage = useMemo(
    () => goals.reduce((sum, goal) => sum + (goal.weightage ?? 0), 0),
    [goals],
  );
  const weightageComplete = totalWeightage === 100;
  const progressWidth = Math.min(Math.max(totalWeightage, 0), 100);
  const progressBarClassName = weightageComplete
    ? "bg-emerald-500"
    : totalWeightage > 100
      ? "bg-red-500"
      : "bg-amber-500";

  const loadOpenCycle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cycle = await getOpenReviewCycle();
      if (cycle) {
        setCycleId(cycle.id);
        setOpenCycle(cycle);
        const rows = await listEmployeeGoals(employee.id, cycle.id);
        setGoals(rows);
      } else {
        setCycleId(null);
        setOpenCycle(null);
        setGoals([]);
      }
    } catch (loadError) {
      setCycleId(null);
      setOpenCycle(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load the review cycle.",
      );
    } finally {
      setLoading(false);
    }
  }, [employee.id]);

  useEffect(() => {
    void loadOpenCycle();
  }, [loadOpenCycle]);

  function resetForm() {
    setEditingGoalId(null);
    setTitle("");
    setDescription("");
    setWeightage("");
    setTargetDate("");
    setFormError(null);
  }

  function startEdit(goal: GoalRow) {
    setEditingGoalId(goal.id);
    setTitle(goal.title);
    setDescription(goal.description ?? "");
    setWeightage(goal.weightage != null ? String(goal.weightage) : "");
    setTargetDate(goal.target_date ?? "");
    setFormError(null);
  }

  async function handleSaveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cycleId) {
      return;
    }

    const parsedWeightage = parseWeightage(weightage);
    if (parsedWeightage === null) {
      setFormError("Weightage must be a whole number between 1 and 100.");
      return;
    }

    if (!targetDate) {
      setFormError("A target date is required.");
      return;
    }

    const today = todayDateInputValue();
    const editingGoal = goals.find((goal) => goal.id === editingGoalId);
    const keepingExistingPastDate =
      editingGoal?.target_date === targetDate && targetDate < today;

    if (targetDate < today && !keepingExistingPastDate) {
      setFormError("Target date cannot be in the past.");
      return;
    }

    setSavingGoal(true);
    setFormError(null);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      weightage: parsedWeightage,
      target_date: targetDate,
    };

    try {
      if (editingGoalId) {
        await updateGoal(editingGoalId, payload);
      } else {
        await createGoal({
          employee_id: employee.id,
          cycle_id: cycleId,
          ...payload,
        });
      }
      const rows = await listEmployeeGoals(employee.id, cycleId);
      setGoals(rows);
      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save this goal.",
      );
    } finally {
      setSavingGoal(false);
    }
  }

  async function handleSubmitForApproval() {
    if (!cycleId || !weightageComplete) {
      return;
    }

    setSubmittingForApproval(true);
    setError(null);

    try {
      await submitDraftGoals(employee.id, cycleId);
      const rows = await listEmployeeGoals(employee.id, cycleId);
      setGoals(rows);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit goals for approval.",
      );
    } finally {
      setSubmittingForApproval(false);
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

  if (error && !openCycle) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        role="alert"
      >
        {error}
        <button
          type="button"
          className="ml-3 font-medium underline"
          onClick={() => void loadOpenCycle()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!openCycle || !cycleId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full rounded-xl border border-zinc-200 bg-white px-8 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold tracking-tight">
            No Active Review Cycle
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Goal setting is currently locked.
          </p>
        </div>
      </div>
    );
  }

  const today = todayDateInputValue();
  const editingGoal = goals.find((goal) => goal.id === editingGoalId);
  const minTargetDate =
    editingGoal?.target_date && editingGoal.target_date < today
      ? editingGoal.target_date
      : today;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Active cycle
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {openCycle.name}
        </h1>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Start date</dt>
            <dd className="mt-1 font-medium">
              {formatDate(openCycle.start_date)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">End date</dt>
            <dd className="mt-1 font-medium">
              {formatDate(openCycle.end_date)}
            </dd>
          </div>
        </dl>
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
            onClick={() => void loadOpenCycle()}
          >
            Try again
          </button>
        </div>
      ) : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold tracking-tight">
          {editingGoalId ? "Edit goal" : "Add a goal"}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Goals you save are stored against this review cycle.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSaveGoal}>
          <label className="block text-sm font-medium">
            Title
            <input
              required
              className={fieldClassName}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Description
            <textarea
              rows={3}
              className={fieldClassName}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Weightage
              <input
                required
                type="number"
                min={1}
                max={100}
                step={1}
                inputMode="numeric"
                className={fieldClassName}
                value={weightage}
                onChange={(event) => setWeightage(event.target.value)}
              />
            </label>

            <label className="block text-sm font-medium">
              Target date
              <input
                required
                type="date"
                min={minTargetDate}
                className={fieldClassName}
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </label>
          </div>

          {formError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            {editingGoalId ? (
              <button
                type="button"
                className="rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={resetForm}
              >
                Cancel
              </button>
            ) : null}
            <button
              type="submit"
              disabled={savingGoal}
              className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {savingGoal
                ? "Saving…"
                : editingGoalId
                  ? "Save goal"
                  : "Add goal"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">My goals</h2>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Total Weightage Assigned: {totalWeightage} / 100%
            </p>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressWidth}
            aria-label="Total weightage assigned"
          >
            <div
              className={`h-full rounded-full transition-all ${progressBarClassName}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>
        {goals.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
            No goals yet for this cycle. Add the first one above.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {goals.map((goal) => (
              <li
                key={goal.id}
                className="flex items-start justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="font-medium">{goal.title}</p>
                  {goal.description ? (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {goal.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {goal.weightage != null ? `${goal.weightage}% · ` : null}
                    {goal.target_date
                      ? `Due ${formatDate(goal.target_date)} · `
                      : null}
                    {goal.status}
                  </p>
                </div>
                {goal.status === "draft" ? (
                  <button
                    type="button"
                    className="shrink-0 text-sm font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                    onClick={() => startEdit(goal)}
                  >
                    Edit
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          disabled={!weightageComplete || submittingForApproval}
          className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          onClick={() => void handleSubmitForApproval()}
        >
          {submittingForApproval
            ? "Submitting…"
            : "Submit Goals for Approval"}
        </button>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Total weightage must equal 100% to submit.
        </p>
      </section>
    </div>
  );
}
