export type ReviewRow = {
  id: string;
  employee_id: string;
  cycle_id: string;
  status: string;
  overall_self_rating: number | null;
  self_summary: string | null;
  submitted_at: string | null;
  created_at: string;
};

export type GoalRatingRow = {
  id: string;
  review_id: string;
  goal_id: string;
  self_comment: string | null;
  self_rating: number | null;
};

export type GoalSelfRatingInput = {
  goal_id: string;
  self_comment: string;
  self_rating: number;
};

export type SelfAppraisalInput = {
  employee_id: string;
  cycle_id: string;
  overall_self_rating: number;
  self_summary: string;
  ratings: GoalSelfRatingInput[];
};
