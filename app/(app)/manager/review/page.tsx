import type { Metadata } from "next";
import { ManagerReviewsListPage } from "./manager-reviews-list-page";

export const metadata: Metadata = {
  title: "Team Reviews · Merit",
  description: "Complete reviews for your direct reports.",
};

export default function Page() {
  return <ManagerReviewsListPage />;
}
