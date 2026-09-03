const BADGE_CLASS: Record<string, string> = {
  "Not Started":
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
  "Self-Appraisal Pending":
    "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  "Goals Pending Approval":
    "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  "Pending Manager Review":
    "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  Completed:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
};

export function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASS[label] ?? BADGE_CLASS["Not Started"]}`}
    >
      {label}
    </span>
  );
}
