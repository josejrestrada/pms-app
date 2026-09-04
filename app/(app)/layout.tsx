import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { EmployeeProvider } from "@/components/employee-provider";
import { AppNav } from "@/components/app-nav";
import { getCurrentEmployee } from "@/lib/current-employee";

function AccountNotSetUp() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-950 font-sans text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex h-10 w-full max-w-6xl items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Merit</span>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16">
        <p className="text-lg text-slate-300">
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
      <div className="flex min-h-screen flex-1 flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 font-sans text-slate-900 dark:from-indigo-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-100">
        <AppNav employee={employee} />
        <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          {children}
        </div>
      </div>
    </EmployeeProvider>
  );
}
