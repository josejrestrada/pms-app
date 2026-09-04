import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { cardClassName } from "@/lib/ui";

export const metadata: Metadata = {
  title: "My Team · Merit",
};

export default function MyTeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Team"
        subtitle="Approve goals and complete reviews for your direct reports."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/manager/goals" className={cardClassName}>
          <h2 className="font-semibold tracking-tight">Team Goals</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Review submitted goals, approve them, or send them back with a
            comment.
          </p>
        </Link>
        <Link href="/manager/review" className={cardClassName}>
          <h2 className="font-semibold tracking-tight">Team Reviews</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
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
