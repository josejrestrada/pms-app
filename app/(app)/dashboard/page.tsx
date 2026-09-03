import type { Metadata } from "next";
import { DashboardPage } from "./dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard · Merit",
  description: "Role-aware performance cycle status and actions.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ alert?: string | string[] }>;
}) {
  const alert = (await searchParams).alert;
  const unauthorized = Array.isArray(alert)
    ? alert.includes("unauthorized")
    : alert === "unauthorized";

  return <DashboardPage unauthorized={unauthorized} />;
}
