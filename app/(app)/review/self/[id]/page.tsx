import { redirect } from "next/navigation";
import { rejectForeignSelfReviewAccess } from "@/lib/authz";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await rejectForeignSelfReviewAccess(id);
  redirect("/review/self");
}
