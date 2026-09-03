import { supabase } from "@/lib/supabase";
import type {
  NewReviewCycle,
  ReviewCycleRow,
  ReviewCycleStatus,
} from "@/lib/types/review-cycle";

export async function getOpenReviewCycle(): Promise<ReviewCycleRow | null> {
  const { data, error } = await supabase
    .from("review_cycles")
    .select(
      "id, name, start_date, end_date, status, created_by, created_at",
    )
    .eq("status", "open")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReviewCycleRow | null) ?? null;
}

export async function getReviewCycleById(
  id: string,
): Promise<ReviewCycleRow | null> {
  const { data, error } = await supabase
    .from("review_cycles")
    .select(
      "id, name, start_date, end_date, status, created_by, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReviewCycleRow | null) ?? null;
}

export async function listReviewCycles(): Promise<ReviewCycleRow[]> {
  const { data, error } = await supabase
    .from("review_cycles")
    .select(
      "id, name, start_date, end_date, status, created_by, created_at",
    )
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReviewCycleRow[];
}

export async function createReviewCycle(input: NewReviewCycle): Promise<void> {
  const { error } = await supabase.from("review_cycles").insert({
    name: input.name,
    start_date: input.start_date,
    end_date: input.end_date,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function setReviewCycleStatus(
  id: string,
  status: ReviewCycleStatus,
): Promise<void> {
  if (status === "open") {
    const { error: closeError } = await supabase
      .from("review_cycles")
      .update({ status: "closed" })
      .eq("status", "open")
      .neq("id", id);

    if (closeError) {
      throw new Error(closeError.message);
    }
  }

  const { error } = await supabase
    .from("review_cycles")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
