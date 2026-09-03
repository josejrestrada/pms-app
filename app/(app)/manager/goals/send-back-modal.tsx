"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

type SendBackModalProps = {
  open: boolean;
  employeeName: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
};

const fieldClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400";

export function SendBackModal({
  open,
  employeeName,
  submitting,
  onClose,
  onConfirm,
}: SendBackModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      setComment("");
      setError(null);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) {
      setError("A comment is required to send goals back.");
      return;
    }

    setError(null);
    await onConfirm(trimmed);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-zinc-200 bg-white p-0 text-zinc-900 shadow-lg backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <form className="p-6" onSubmit={handleSubmit}>
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          Send back goals
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add a comment for {employeeName}. This is required before sending
          their submitted goals back.
        </p>

        <label className="mt-5 block text-sm font-medium">
          Comment
          <textarea
            required
            rows={4}
            className={fieldClassName}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {submitting ? "Sending…" : "Send back"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
