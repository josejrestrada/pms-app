import type { Metadata } from "next";
import { ManagerGoalsPage } from "./manager-goals-page";

export const metadata: Metadata = {
  title: "Team Goals · Merit",
  description: "Review submitted goals from your direct reports.",
};

export default function Page() {
  return <ManagerGoalsPage />;
}
