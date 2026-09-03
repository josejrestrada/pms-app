import type { Metadata } from "next";
import { ManagerReviewPage } from "./manager-review-page";

export const metadata: Metadata = {
  title: "Complete Review · Merit",
  description: "Complete a direct report’s performance review.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManagerReviewPage reviewId={id} />;
}
