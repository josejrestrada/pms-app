import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Team · Merit",
};

export default function MyTeamPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My Team</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Your team’s goals and reviews will appear here.
      </p>
    </div>
  );
}
