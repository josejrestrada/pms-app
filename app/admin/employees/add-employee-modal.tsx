"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createEmployee } from "@/lib/employees";
import type { EmployeeRole, EmployeeWithManager } from "@/lib/types/employee";

type AddEmployeeModalProps = {
  open: boolean;
  employees: EmployeeWithManager[];
  onClose: () => void;
  onCreated: () => Promise<void> | void;
};

const ROLES: { value: EmployeeRole; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "hr_admin", label: "HR Admin" },
];

const fieldClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400";

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function AddEmployeeModal({
  open,
  employees,
  onClose,
  onCreated,
}: AddEmployeeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState(todayDateInputValue);
  const [managerId, setManagerId] = useState("");
  const [role, setRole] = useState<EmployeeRole>("employee");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      setFullName("");
      setEmail("");
      setDesignation("");
      setDepartment("");
      setDateOfJoining(todayDateInputValue());
      setManagerId("");
      setRole("employee");
      setIsActive(true);
      setError(null);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createEmployee({
        full_name: fullName.trim(),
        email: email.trim(),
        designation: designation.trim(),
        department: department.trim(),
        date_of_joining: dateOfJoining,
        manager_id: managerId || null,
        role,
        is_active: isActive,
      });
      await onCreated();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not add this employee. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-zinc-200 bg-white p-0 text-zinc-900 shadow-lg backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <form className="p-6" onSubmit={handleSubmit}>
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          Add employee
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a new record in the employee directory.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="block text-sm font-medium">
            Name
            <input
              required
              autoComplete="name"
              className={fieldClassName}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              className={fieldClassName}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Designation
            <input
              required
              className={fieldClassName}
              value={designation}
              onChange={(event) => setDesignation(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Department
            <input
              required
              className={fieldClassName}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Date of joining
            <input
              required
              type="date"
              className={fieldClassName}
              value={dateOfJoining}
              onChange={(event) => setDateOfJoining(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Manager
            <select
              className={fieldClassName}
              value={managerId}
              onChange={(event) => setManagerId(event.target.value)}
            >
              <option value="">No manager</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Role
            <select
              className={fieldClassName}
              value={role}
              onChange={(event) =>
                setRole(event.target.value as EmployeeRole)
              }
            >
              {ROLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Status
            <select
              className={fieldClassName}
              value={isActive ? "active" : "inactive"}
              onChange={(event) =>
                setIsActive(event.target.value === "active")
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {submitting ? "Adding…" : "Add employee"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
