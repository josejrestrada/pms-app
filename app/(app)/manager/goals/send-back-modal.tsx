"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { dialogClassName, fieldClassName, primaryButtonClassName, secondaryButtonClassName } from "@/lib/ui";

type SendBackModalProps = {
  open: boolean;
  employeeName: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
};

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
          Send back goals
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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
            {submitting ? "Sending…" : "Send back"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
