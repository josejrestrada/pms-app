import { supabase } from "@/lib/supabase";
import type {
  EmployeeWithManager,
  NewEmployee,
} from "@/lib/types/employee";

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

export async function listEmployees(): Promise<EmployeeWithManager[]> {
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EmployeeWithManager[];
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
