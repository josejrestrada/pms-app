export type ReviewCycleStatus = "draft" | "open" | "closed";

export type ReviewCycleRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: ReviewCycleStatus;
  created_by: string | null;
  created_at: string;
};

export type NewReviewCycle = {
  name: string;
  start_date: string;
  end_date: string;
};
