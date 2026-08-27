import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Goals · Merit",
};

export default function MyGoalsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My Goals</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Your goals for the current review cycle will appear here.
      </p>
    </div>
  );
}
