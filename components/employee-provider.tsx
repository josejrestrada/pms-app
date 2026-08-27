"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EmployeeRow } from "@/lib/types/employee";

const EmployeeContext = createContext<EmployeeRow | null>(null);

export function EmployeeProvider({
  employee,
  children,
}: {
  employee: EmployeeRow;
  children: ReactNode;
}) {
  return (
    <EmployeeContext.Provider value={employee}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const employee = useContext(EmployeeContext);
  if (!employee) {
    throw new Error("useEmployee must be used within EmployeeProvider");
  }
  return employee;
}
