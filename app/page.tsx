import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Merit",
  description: "Performance management for a 200-person services company.",
};

const features = [
  {
    title: "Goals",
    description:
      "Set KRAs, KPIs, and SMART goals so every person knows what success looks like.",
  },
  {
    title: "Reviews",
    description:
      "Run structured appraisal cycles with self-assessments, manager reviews, and calibration.",
  },
  {
    title: "Feedback",
    description:
      "Keep performance conversations going with check-ins and feedback between cycles.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-semibold tracking-tight">Merit</span>
          <Link
            href="/sign-in"
            className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight">Merit</h1>
          <p className="mt-4 text-lg leading-7 text-zinc-600 dark:text-zinc-400">
            Performance management for a 200-person services company.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-sm font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
