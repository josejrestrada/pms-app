import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "My Team · Merit",
};

const cardClassName =
  "rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600";

export default function MyTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Team</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Approve goals and complete reviews for your direct reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/manager/goals" className={cardClassName}>
          <h2 className="font-semibold tracking-tight">Team Goals</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Review submitted goals, approve them, or send them back with a
            comment.
          </p>
        </Link>
        <Link href="/manager/review" className={cardClassName}>
          <h2 className="font-semibold tracking-tight">Team Reviews</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Complete side-by-side reviews after a self-appraisal is submitted.
          </p>
        </Link>
      </div>

      <EmptyState
        title="Need a status snapshot?"
        description="The dashboard lists each direct report with completion badges and the next action."
        action={{ href: "/dashboard", label: "Open dashboard" }}
      />
    </div>
  );
}
