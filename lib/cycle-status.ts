import type { GoalRow } from "@/lib/types/goal";
import type { ReviewRow } from "@/lib/types/review";

export type CycleProgressStatus =
  | "not_started"
  | "goals_pending_approval"
  | "self_appraisal_pending"
  | "manager_review_pending"
  | "completed";

export function cycleProgressStatus(
  goals: GoalRow[],
  review: ReviewRow | null,
): CycleProgressStatus {
  if (review?.status === "completed") {
    return "completed";
  }

  if (review?.status === "self_submitted") {
    return "manager_review_pending";
  }

  if (goals.some((goal) => goal.status === "approved")) {
    return "self_appraisal_pending";
  }

  if (goals.some((goal) => goal.status === "submitted")) {
    return "goals_pending_approval";
  }

  return "not_started";
}

export function employeeReviewBadgeLabel(
  status: CycleProgressStatus,
): "Not Started" | "Self-Appraisal Pending" | "Completed" {
  if (status === "completed" || status === "manager_review_pending") {
    return "Completed";
  }

  if (status === "self_appraisal_pending") {
    return "Self-Appraisal Pending";
  }

  return "Not Started";
}

export function teamMemberBadgeLabel(status: CycleProgressStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "manager_review_pending":
      return "Pending Manager Review";
    case "self_appraisal_pending":
      return "Self-Appraisal Pending";
    case "goals_pending_approval":
      return "Goals Pending Approval";
    default:
      return "Not Started";
  }
}

export function hrBucket(
  status: CycleProgressStatus,
): "pending_self" | "pending_manager" | "completed" {
  if (status === "completed") {
    return "completed";
  }
  if (status === "manager_review_pending") {
    return "pending_manager";
  }
  return "pending_self";
}
