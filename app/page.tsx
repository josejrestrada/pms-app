import type { Metadata } from "next";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { BarChart3, Sparkles, Target, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Merit",
  description:
    "Replace spreadsheets and email chains with continuous goal setting, side-by-side manager reviews, and company-wide performance tracking.",
};

const features = [
  {
    title: "Goals",
    pill: "100% weightage",
    icon: Target,
    description:
      "Employees set SMART KRAs with integer weightage, target dates, and a cycle lock so nothing ships without an open review period.",
  },
  {
    title: "Reviews",
    pill: "Side-by-side",
    icon: UserCheck,
    description:
      "Self-appraisal and manager evaluation sit on one screen—comments, 1–5 ratings, and a complete-review action with a full audit trail.",
  },
  {
    title: "Analytics",
    pill: "HR admin",
    icon: BarChart3,
    description:
      "Role-aware dashboards track completion by department, pending self-appraisals, and manager reviews, with CSV export for calibration.",
  },
];

const signInClassName =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white font-sans text-slate-900 dark:from-indigo-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-[0_0_16px_rgba(79,70,229,0.65)]">
              <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden />
              <span className="absolute inset-0 animate-pulse rounded-lg bg-indigo-400/30" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Merit</span>
          </Link>
          <div>
            <Show when="signed-out">
              <Link href="/sign-in" className={signInClassName}>
                Sign In
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className={signInClassName}>
                Open app
              </Link>
            </Show>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pb-20 pt-16 text-center sm:pt-24">
          <p className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-slate-900/80 dark:text-indigo-300">
            ✨ Enterprise Appraisal System
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            Performance appraisals built for modern engineering teams.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600 dark:text-slate-400">
            Replace spreadsheets and email chains with continuous goal setting,
            side-by-side manager reviews, and company-wide performance tracking.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 sm:w-auto"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-400 hover:bg-white sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900"
            >
              View Demo
            </Link>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 pb-20"
        >
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {feature.pill}
                    </span>
                  </div>
                  <h2 className="mt-5 text-lg font-bold tracking-tight">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 px-6 py-5 text-center text-sm text-slate-500 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        Built for 200+ employee organizations • 100% Audit Ready • Role-based
        Security
      </footer>
    </div>
  );
}
