import type { Metadata } from "next";
import { CyclesPage } from "./cycles-page";

export const metadata: Metadata = {
  title: "Review cycles · Merit",
  description: "Manage performance review cycles in Merit.",
};

export default function Page() {
  return <CyclesPage />;
}
