import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { EmployeeProvider } from "@/components/employee-provider";
import { AppNav } from "@/components/app-nav";
import { getCurrentEmployee } from "@/lib/current-employee";

function AccountNotSetUp() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-semibold tracking-tight">Merit</span>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16">
        <p className="text-lg text-zinc-700 dark:text-zinc-300">
          Your account is not yet set up. Please contact HR.
        </p>
      </main>
    </div>
  );
}

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  await auth.protect();
  const employee = await getCurrentEmployee();

  if (!employee) {
    return <AccountNotSetUp />;
  }

  return (
    <EmployeeProvider employee={employee}>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <AppNav employee={employee} />
        <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</div>
      </div>
    </EmployeeProvider>
  );
}
