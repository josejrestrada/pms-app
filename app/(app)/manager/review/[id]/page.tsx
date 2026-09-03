import type { Metadata } from "next";
import { requireManagerReviewAccess } from "@/lib/authz";
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
  await requireManagerReviewAccess(id);
  return <ManagerReviewPage reviewId={id} />;
}
