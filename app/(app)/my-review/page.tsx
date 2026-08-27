import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Review · Merit",
};

export default function MyReviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My Review</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Your self-appraisal and review status will appear here.
      </p>
    </div>
  );
}
