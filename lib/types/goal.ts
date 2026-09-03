export type GoalRow = {
  id: string;
  employee_id: string | null;
  cycle_id: string | null;
  title: string;
  description: string | null;
  weightage: number | null;
  target_date: string | null;
  status: string;
  manager_comment: string | null;
  created_at: string;
};

export type NewGoal = {
  employee_id: string;
  cycle_id: string;
  title: string;
  description: string | null;
  weightage: number | null;
  target_date: string | null;
};
