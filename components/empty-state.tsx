import Link from "next/link";
import { primaryButtonClassName, skeletonClassName } from "@/lib/ui";

type EmptyAction =
  | { href: string; label: string; onClick?: never }
  | { onClick: () => void; label: string; href?: never };

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: EmptyAction;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-8 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
      {action ? (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href} className={primaryButtonClassName}>
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function PageSkeleton({
  variant = "page",
}: {
  variant?: "page" | "metrics" | "table";
}) {
  if (variant === "metrics") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={`h-24 ${skeletonClassName}`} />
          <div className={`h-24 ${skeletonClassName}`} />
          <div className={`h-24 ${skeletonClassName}`} />
        </div>
        <div className={`h-48 ${skeletonClassName}`} />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <div className={`h-10 w-48 ${skeletonClassName}`} />
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`h-12 border-b border-slate-100 last:border-b-0 dark:border-slate-800 ${skeletonClassName}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className={`h-28 ${skeletonClassName}`} />
      <div className={`h-48 ${skeletonClassName}`} />
    </div>
  );
}
