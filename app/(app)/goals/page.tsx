import type { Metadata } from "next";
import { GoalsPage } from "./goals-page";

export const metadata: Metadata = {
  title: "Goals · Merit",
  description: "Set and manage your performance goals.",
};

export default function Page() {
  return <GoalsPage />;
}
