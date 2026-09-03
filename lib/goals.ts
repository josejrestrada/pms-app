import { supabase } from "@/lib/supabase";
import type { GoalRow, NewGoal } from "@/lib/types/goal";

const GOAL_SELECT =
  "id, employee_id, cycle_id, title, description, weightage, target_date, status, manager_comment, created_at";

export async function listEmployeeGoals(
  employeeId: string,
  cycleId: string,
): Promise<GoalRow[]> {
  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_SELECT)
    .eq("employee_id", employeeId)
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GoalRow[];
}

export async function listApprovedEmployeeGoals(
  employeeId: string,
  cycleId: string,
): Promise<GoalRow[]> {
  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_SELECT)
    .eq("employee_id", employeeId)
    .eq("cycle_id", cycleId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GoalRow[];
}

export async function listGoalsForEmployees(
  employeeIds: string[],
  cycleId: string,
): Promise<GoalRow[]> {
  if (employeeIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_SELECT)
    .in("employee_id", employeeIds)
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GoalRow[];
}

export async function createGoal(input: NewGoal): Promise<void> {
  const { error } = await supabase.from("goals").insert({
    employee_id: input.employee_id,
    cycle_id: input.cycle_id,
    title: input.title,
    description: input.description,
    weightage: input.weightage,
    target_date: input.target_date,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateGoal(
  id: string,
  input: Pick<NewGoal, "title" | "description" | "weightage" | "target_date">,
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({
      title: input.title,
      description: input.description,
      weightage: input.weightage,
      target_date: input.target_date,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listSubmittedGoalsForEmployees(
  employeeIds: string[],
  cycleId: string,
): Promise<GoalRow[]> {
  if (employeeIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_SELECT)
    .in("employee_id", employeeIds)
    .eq("cycle_id", cycleId)
    .in("status", ["submitted", "approved", "sent_back"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GoalRow[];
}

export async function approveEmployeeGoals(
  employeeId: string,
  cycleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ status: "approved" })
    .eq("employee_id", employeeId)
    .eq("cycle_id", cycleId)
    .eq("status", "submitted");

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendBackEmployeeGoals(
  employeeId: string,
  cycleId: string,
  comment: string,
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ status: "sent_back", manager_comment: comment })
    .eq("employee_id", employeeId)
    .eq("cycle_id", cycleId)
    .eq("status", "submitted");

  if (error) {
    throw new Error(error.message);
  }
}

export async function submitDraftGoals(
  employeeId: string,
  cycleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ status: "submitted" })
    .eq("employee_id", employeeId)
    .eq("cycle_id", cycleId)
    .eq("status", "draft");

  if (error) {
    throw new Error(error.message);
  }
}
