import { supabase } from "@/lib/supabase";
import type {
  GoalRatingRow,
  ReviewRow,
  SelfAppraisalInput,
} from "@/lib/types/review";

const REVIEW_SELECT =
  "id, employee_id, cycle_id, status, overall_self_rating, self_summary, submitted_at, created_at";

const GOAL_RATING_SELECT =
  "id, review_id, goal_id, self_comment, self_rating";

export async function getEmployeeCycleReview(
  employeeId: string,
  cycleId: string,
): Promise<ReviewRow | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("employee_id", employeeId)
    .eq("cycle_id", cycleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReviewRow | null) ?? null;
}

export async function listGoalRatings(
  reviewId: string,
): Promise<GoalRatingRow[]> {
  const { data, error } = await supabase
    .from("goal_ratings")
    .select(GOAL_RATING_SELECT)
    .eq("review_id", reviewId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GoalRatingRow[];
}

export async function submitSelfAppraisal(
  input: SelfAppraisalInput,
): Promise<void> {
  const submittedAt = new Date().toISOString();
  const reviewPayload = {
    employee_id: input.employee_id,
    cycle_id: input.cycle_id,
    overall_self_rating: input.overall_self_rating,
    self_summary: input.self_summary,
    status: "self_submitted",
    submitted_at: submittedAt,
  };

  const existing = await getEmployeeCycleReview(
    input.employee_id,
    input.cycle_id,
  );

  let reviewId: string;

  if (existing) {
    const { error } = await supabase
      .from("reviews")
      .update(reviewPayload)
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    reviewId = existing.id;

    const { error: deleteError } = await supabase
      .from("goal_ratings")
      .delete()
      .eq("review_id", reviewId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  } else {
    const { data, error } = await supabase
      .from("reviews")
      .insert(reviewPayload)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    reviewId = (data as { id: string }).id;
  }

  const { error: ratingsError } = await supabase.from("goal_ratings").insert(
    input.ratings.map((rating) => ({
      review_id: reviewId,
      goal_id: rating.goal_id,
      self_comment: rating.self_comment,
      self_rating: rating.self_rating,
    })),
  );

  if (ratingsError) {
    throw new Error(ratingsError.message);
  }
}
