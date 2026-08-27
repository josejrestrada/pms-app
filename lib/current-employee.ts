import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  findEmployeeByEmail,
  linkEmployeeClerkUserId,
} from "@/lib/employees";
import type { EmployeeRow } from "@/lib/types/employee";

function clerkEmail(user: {
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses: { emailAddress: string }[];
}): string | null {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null
  );
}

export const getCurrentEmployee = cache(
  async (): Promise<EmployeeRow | null> => {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return null;
    }

    const user = await currentUser();
    if (!user) {
      return null;
    }

    const email = clerkEmail(user);
    if (!email) {
      return null;
    }

    const employee = await findEmployeeByEmail(email);
    if (!employee) {
      return null;
    }

    if (!employee.clerk_user_id) {
      await linkEmployeeClerkUserId(employee.id, userId);
      return { ...employee, clerk_user_id: userId };
    }

    return employee;
  },
);
