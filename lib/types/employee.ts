export type EmployeeRole = "hr_admin" | "manager" | "employee";

export type EmployeeRow = {
  id: string;
  clerk_user_id: string | null;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  date_of_joining: string;
  manager_id: string | null;
  role: EmployeeRole;
  is_active: boolean;
  created_at: string;
};

export type EmployeeWithManager = EmployeeRow & {
  manager: { full_name: string } | null;
};

export type NewEmployee = {
  full_name: string;
  email: string;
  designation: string;
  department: string;
  date_of_joining: string;
  manager_id: string | null;
  role: EmployeeRole;
  is_active: boolean;
};
