import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const { expenseId, employeeEmail, merchant, amount } = await request.json();

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ["sannwoy.bandyopadhyay@gmail.com"], // Escalation target email
      subject: `[ACTION REQUIRED] Escalated Expense: ${merchant} ($${amount})`,
      html: `
        <h2>Expense Escalation Review Required</h2>
        <p><strong>Employee:</strong> ${employeeEmail}</p>
        <p><strong>Merchant:</strong> ${merchant}</p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p>This expense was flagged by HR for manager review.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}