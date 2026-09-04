const PILL =
  "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize";

const TONE = {
  success:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  info: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  muted:
    "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  accent:
    "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
} as const;

function toneFor(label: string): keyof typeof TONE {
  const key = label.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (
    key === "approved" ||
    key === "completed" ||
    key === "open" ||
    key === "active"
  ) {
    return "success";
  }

  if (key === "self_submitted" || key === "self_appraisal_submitted") {
    return "accent";
  }

  if (
    key === "submitted" ||
    key === "goals_submitted" ||
    key === "pending_manager_review" ||
    key.includes("manager_review")
  ) {
    return "info";
  }

  if (key === "sent_back" || key === "sentback" || key === "closed") {
    return "danger";
  }

  if (
    key === "draft" ||
    key === "pending" ||
    key === "awaiting" ||
    key === "not_started" ||
    key === "self_appraisal_pending" ||
    key === "goals_pending_approval" ||
    key.includes("pending")
  ) {
    return "warning";
  }

  return "muted";
}

export function StatusBadge({ label }: { label: string }) {
  const display = label.replace(/_/g, " ");
  return <span className={`${PILL} ${TONE[toneFor(label)]}`}>{display}</span>;
}
