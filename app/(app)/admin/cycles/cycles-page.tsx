"use client";

import { useCallback, useEffect, useState } from "react";
import { listReviewCycles, setReviewCycleStatus } from "@/lib/review-cycles";
import type {
  ReviewCycleRow,
  ReviewCycleStatus,
} from "@/lib/types/review-cycle";
import { CreateCycleModal } from "./create-cycle-modal";

const STATUS_STYLES: Record<ReviewCycleStatus, string> = {
  draft:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  open: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  closed: "bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400",
};

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CyclesPage() {
  const [cycles, setCycles] = useState<ReviewCycleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCycles = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const rows = await listReviewCycles();
      setCycles(rows);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load review cycles.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCycles();
  }, [fetchCycles]);

  async function handleStatusChange(
    cycle: ReviewCycleRow,
    status: ReviewCycleStatus,
  ) {
    if (status === "open") {
      const currentlyOpen = cycles.find(
        (row) => row.status === "open" && row.id !== cycle.id,
      );

      if (currentlyOpen) {
        const confirmed = window.confirm(
          `${currentlyOpen.name} is currently open and will be closed. Open ${cycle.name} instead?`,
        );
        if (!confirmed) {
          return;
        }
      }
    }

    setUpdatingId(cycle.id);
    setError(null);

    try {
      await setReviewCycleStatus(cycle.id, status);
      await fetchCycles(false);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update this cycle.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Review cycles
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Only one cycle can be open at a time.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            onClick={() => setModalOpen(true)}
          >
            Create cycle
          </button>
        </div>

        {error ? (
          <div
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {error}
            <button
              type="button"
              className="ml-3 font-medium underline"
              onClick={() => void fetchCycles()}
            >
              Try again
            </button>
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">End</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="h-4 w-24 max-w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : cycles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <p className="font-medium">No review cycles yet</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Create a cycle to start a performance review period.
                    </p>
                  </td>
                </tr>
              ) : (
                cycles.map((cycle) => {
                  const busy = updatingId === cycle.id;

                  return (
                    <tr key={cycle.id}>
                      <td className="px-4 py-3 font-medium">{cycle.name}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(cycle.start_date)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(cycle.end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[cycle.status]}`}
                        >
                          {cycle.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {cycle.status !== "open" ? (
                            <button
                              type="button"
                              disabled={busy}
                              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              onClick={() =>
                                void handleStatusChange(cycle, "open")
                              }
                            >
                              {busy ? "Updating…" : "Open"}
                            </button>
                          ) : null}
                          {cycle.status === "open" ? (
                            <button
                              type="button"
                              disabled={busy}
                              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              onClick={() =>
                                void handleStatusChange(cycle, "closed")
                              }
                            >
                              {busy ? "Updating…" : "Close"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      <CreateCycleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => fetchCycles(false)}
      />
    </>
  );
}
