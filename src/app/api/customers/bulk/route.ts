import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

// POST bulk insert multiple customers from CSV JSON mapping
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: "Expected an array of customers" }, { status: 400 });

    const validCustomers = body.filter((c: any) => c.CustomerName).map((c: any) => ({
      userId: user.id,
      CustomerName: String(c.CustomerName).trim(),
      NTN_CNIC: c.NTN_CNIC ? String(c.NTN_CNIC).trim() : null,
      Address: c.Address ? String(c.Address).trim() : null,
      BuyerType: c.BuyerType ? String(c.BuyerType).trim() : "Individual",
    }));

    if (validCustomers.length === 0) return NextResponse.json({ error: "No valid customers found in CSV structure." }, { status: 400 });

    const result = await prisma.customer.createMany({
      data: validCustomers,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: `Successfully imported ${result.count} customers`, count: result.count });
  } catch (err: any) {
    console.error("Bulk Create Customers Error:", err);
    return NextResponse.json({ error: `Failed to bulk import customers: ${err.message}` }, { status: 500 });
  }
}
