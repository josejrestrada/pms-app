import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Goals · Merit",
};

export default function MyGoalsPage() {
  redirect("/goals");
}
