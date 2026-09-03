import Link from "next/link";

const primaryActionClassName =
  "inline-flex items-center justify-center rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";

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
    <div className="rounded-xl border border-zinc-200 bg-white px-8 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {action ? (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href} className={primaryActionClassName}>
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              className={primaryActionClassName}
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
          <div className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <div className="h-10 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse border-b border-zinc-100 bg-zinc-50 last:border-b-0 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-28 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
