import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCurrentEmployee } from "@/lib/current-employee";
import { findEmployeeById } from "@/lib/employees";
import { getOpenReviewCycle } from "@/lib/review-cycles";

export async function POST() {
  try {
    const employee = await getCurrentEmployee();
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!employee.manager_id) {
      return NextResponse.json({ ok: true, skipped: "no_manager" });
    }

    const manager = await findEmployeeById(employee.manager_id);
    if (!manager?.email) {
      console.error("notify-manager: manager email missing", employee.manager_id);
      return NextResponse.json({ ok: true, skipped: "no_manager_email" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("notify-manager: RESEND_API_KEY is not set");
      return NextResponse.json({ ok: false, skipped: "missing_api_key" });
    }

    const cycle = await getOpenReviewCycle();
    const cycleLabel = cycle?.name ?? "the current review cycle";
    const from =
      process.env.RESEND_FROM_EMAIL ?? "Merit <beth.t@example.com>";

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: manager.email,
      subject: `${employee.full_name} submitted a self-appraisal`,
      html: `
        <p>Hello ${manager.full_name},</p>
        <p>${employee.full_name} has submitted their self-appraisal for ${cycleLabel}.</p>
        <p>Please review it in Merit when you are ready.</p>
      `,
    });

    if (error) {
      console.error("notify-manager: Resend delivery failed", error);
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("notify-manager: unexpected failure", error);
    return NextResponse.json({ ok: false });
  }
}
