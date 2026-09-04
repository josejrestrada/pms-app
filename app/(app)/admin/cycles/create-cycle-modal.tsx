"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createReviewCycle } from "@/lib/review-cycles";
import { dialogClassName, fieldClassName, primaryButtonClassName, secondaryButtonClassName } from "@/lib/ui";

type CreateCycleModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
};

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateCycleModal({
  open,
  onClose,
  onCreated,
}: CreateCycleModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayDateInputValue);
  const [endDate, setEndDate] = useState(todayDateInputValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      setName("");
      setStartDate(todayDateInputValue());
      setEndDate(todayDateInputValue());
      setError(null);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      setSubmitting(false);
      return;
    }

    try {
      await createReviewCycle({
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
      });
      await onCreated();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create this cycle. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={dialogClassName}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <form className="p-6" onSubmit={handleSubmit}>
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          Create cycle
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          New cycles start in draft until you open them.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="block text-sm font-medium">
            Name
            <input
              required
              className={fieldClassName}
              placeholder="FY 2026 H2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Start date
            <input
              required
              type="date"
              className={fieldClassName}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            End date
            <input
              required
              type="date"
              className={fieldClassName}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={primaryButtonClassName}
          >
            {submitting ? "Creating…" : "Create cycle"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
