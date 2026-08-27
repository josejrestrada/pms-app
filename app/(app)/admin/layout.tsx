import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/current-employee";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const employee = await getCurrentEmployee();

  if (employee?.role !== "hr_admin") {
    redirect("/dashboard");
  }

  return children;
}
