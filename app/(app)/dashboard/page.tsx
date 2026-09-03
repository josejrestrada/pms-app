import type { Metadata } from "next";
import { DashboardPage } from "./dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard · Merit",
  description: "Role-aware performance cycle status and actions.",
};

export default function Page() {
  return <DashboardPage />;
}
