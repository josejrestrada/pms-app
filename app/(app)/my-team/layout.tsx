import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/current-employee";

export default async function MyTeamLayout({
  children,
}: {
  children: ReactNode;
}) {
  const employee = await getCurrentEmployee();

  if (employee?.role !== "manager") {
    redirect("/dashboard");
  }

  return children;
}
