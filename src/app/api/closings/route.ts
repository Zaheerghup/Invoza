import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

// POST /api/closings -> Perform a period closing (Rule 150R(4)(f))
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, companyId, date } = body; // type: DAY, WEEK, MONTH

    if (!type || !companyId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // If WEEK or MONTH, adjust startDate accordingly
    if (type === "WEEK") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (type === "MONTH") {
      startDate.setMonth(startDate.getMonth(), 1);
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        userId: user.id,
        companyId: Number(companyId),
        InvoiceDate: {
          gte: startDate,
          lte: endDate,
        },
        FBR_Status: "SUBMITTED"
      }
    });

    const totalInvoices = invoices.length;
    const totalValue = invoices.reduce((acc, inv) => acc + (inv.TotalAmount - inv.SalesTax), 0);
    const totalTax = invoices.reduce((acc, inv) => acc + inv.SalesTax, 0);

    const closing = await prisma.closing.create({
      data: {
        type,
        periodDate: new Date(date),
        totalInvoices,
        totalValue,
        totalTax,
        companyId: Number(companyId),
        userId: user.id,
      }
    });

    // Also log this as a system event
    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      userId: user.id,
      action: "SUBMIT",
      type: "SYSTEM",
      details: `${type} Closing performed for ${date}. Total Invoices: ${totalInvoices}`,
      changes: closing
    });

    return NextResponse.json(closing);
  } catch (err: any) {
    console.error("Closing Error:", err);
    return NextResponse.json({ error: "Failed to perform closing: " + err.message }, { status: 500 });
  }
}
