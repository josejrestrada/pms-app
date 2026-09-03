import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Review · Merit",
};

export default function MyReviewPage() {
  redirect("/review/self");
}
