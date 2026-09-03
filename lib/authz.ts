import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/current-employee";
import { findEmployeeById } from "@/lib/employees";
import { getReviewById } from "@/lib/reviews";
import type { EmployeeRole, EmployeeRow } from "@/lib/types/employee";
import type { ReviewRow } from "@/lib/types/review";

export const UNAUTHORIZED_HREF = "/dashboard?alert=unauthorized";

export function redirectUnauthorized(): never {
  redirect(UNAUTHORIZED_HREF);
}

export async function requireCurrentEmployee(): Promise<EmployeeRow> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    redirectUnauthorized();
  }
  return employee;
}

export async function requireRole(
  allowed: EmployeeRole[],
): Promise<EmployeeRow> {
  const employee = await requireCurrentEmployee();
  if (!allowed.includes(employee.role)) {
    redirectUnauthorized();
  }
  return employee;
}

export async function requireManagerReviewAccess(reviewId: string): Promise<{
  manager: EmployeeRow;
  review: ReviewRow;
  subject: EmployeeRow;
}> {
  const manager = await requireRole(["manager"]);
  const review = await getReviewById(reviewId);
  if (!review) {
    redirectUnauthorized();
  }

  const subject = await findEmployeeById(review.employee_id);
  if (!subject || subject.manager_id !== manager.id) {
    redirectUnauthorized();
  }

  return { manager, review, subject };
}

export async function rejectForeignSelfReviewAccess(
  requestedId: string | undefined,
): Promise<void> {
  if (!requestedId) {
    return;
  }

  const employee = await requireCurrentEmployee();
  if (requestedId === employee.id) {
    return;
  }

  const review = await getReviewById(requestedId);
  if (review?.employee_id === employee.id) {
    return;
  }

  redirectUnauthorized();
}
