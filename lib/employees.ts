import { supabase } from "@/lib/supabase";
import type {
  EmployeeRow,
  EmployeeWithManager,
  NewEmployee,
} from "@/lib/types/employee";

const EMPLOYEE_ROW_SELECT =
  "id, clerk_user_id, full_name, email, designation, department, date_of_joining, manager_id, role, is_active, created_at";

const EMPLOYEE_SELECT = `
  id,
  clerk_user_id,
  full_name,
  email,
  designation,
  department,
  date_of_joining,
  manager_id,
  role,
  is_active,
  created_at,
  manager:manager_id ( full_name )
`;

type ManagerEmbed = { full_name: string } | { full_name: string }[] | null;

function normalizeManager(manager: ManagerEmbed): { full_name: string } | null {
  if (!manager) {
    return null;
  }

  return Array.isArray(manager) ? (manager[0] ?? null) : manager;
}

export async function listDirectReports(
  managerId: string,
): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_ROW_SELECT)
    .eq("manager_id", managerId)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EmployeeRow[];
}

export async function listEmployees(): Promise<EmployeeWithManager[]> {
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    ...(row as unknown as EmployeeRow),
    manager: normalizeManager(row.manager),
  }));
}

export async function createEmployee(input: NewEmployee): Promise<void> {
  const { error } = await supabase.from("employees").insert({
    full_name: input.full_name,
    email: input.email,
    designation: input.designation,
    department: input.department,
    date_of_joining: input.date_of_joining,
    manager_id: input.manager_id,
    role: input.role,
    is_active: input.is_active,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function escapeIlike(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function findEmployeeByEmail(
  email: string,
): Promise<EmployeeRow | null> {
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_ROW_SELECT)
    .ilike("email", escapeIlike(email.trim()))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as EmployeeRow | null) ?? null;
}

export async function linkEmployeeClerkUserId(
  employeeId: string,
  clerkUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("employees")
    .update({ clerk_user_id: clerkUserId })
    .eq("id", employeeId)
    .is("clerk_user_id", null);

  if (error) {
    throw new Error(error.message);
  }
}
