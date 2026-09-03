import type { Metadata } from "next";
import { rejectForeignSelfReviewAccess } from "@/lib/authz";
import { SelfAppraisalPage } from "./self-appraisal-page";

export const metadata: Metadata = {
  title: "Self-Appraisal · Merit",
  description: "Submit your self-appraisal for the open review cycle.",
};

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  await rejectForeignSelfReviewAccess(
    firstQueryValue(query.id) ?? firstQueryValue(query.employeeId),
  );
  return <SelfAppraisalPage />;
}
