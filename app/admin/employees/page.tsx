import type { Metadata } from "next";
import { EmployeesPage } from "./employees-page";

export const metadata: Metadata = {
  title: "Employees · Merit",
  description: "Manage employees in Merit.",
};

export default function Page() {
  return <EmployeesPage />;
}
