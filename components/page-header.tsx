export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
