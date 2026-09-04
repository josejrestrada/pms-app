"use client";

import { useCallback, useEffect, useState } from "react";
import { listReviewCycles, setReviewCycleStatus } from "@/lib/review-cycles";
import type {
  ReviewCycleRow,
  ReviewCycleStatus,
} from "@/lib/types/review-cycle";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
  tableBodyClassName,
  tableHeadRowClassName,
  tableRowClassName,
} from "@/lib/ui";
import { CreateCycleModal } from "./create-cycle-modal";

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
        <PageHeader
          title="Review cycles"
          subtitle="Only one cycle can be open at a time."
        />
        <button
          type="button"
          className={primaryButtonClassName}
          onClick={() => setModalOpen(true)}
        >
          Create cycle
        </button>
      </div>

      {error ? (
        <div
          className="mt-6 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
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

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className={tableHeadRowClassName}>
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className={tableBodyClassName}>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 5 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-4 w-24 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : cycles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8">
                  <EmptyState
                    title="No review cycles yet"
                    description="Create a cycle to start a performance review period for the company."
                    action={{
                      label: "Create cycle",
                      onClick: () => setModalOpen(true),
                    }}
                  />
                </td>
              </tr>
            ) : (
              cycles.map((cycle) => {
                const busy = updatingId === cycle.id;

                return (
                  <tr key={cycle.id} className={tableRowClassName}>
                    <td className="px-4 py-3 font-medium">{cycle.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(cycle.start_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(cycle.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={cycle.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {cycle.status !== "open" ? (
                          <button
                            type="button"
                            disabled={busy}
                            className={`${secondaryButtonClassName} !px-2.5 !py-1 text-xs`}
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
                            className={`${secondaryButtonClassName} !px-2.5 !py-1 text-xs`}
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
