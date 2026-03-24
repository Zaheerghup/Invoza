import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { CustomerName, NTN_CNIC, Address, Province, BuyerType } = await req.json();
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Customer not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        CustomerName,
        NTN_CNIC,
        Address,
        Province: Province || existing.Province,
        BuyerType,
      },
    });

    console.log(`[SUCCESS] Customer updated: ${updated.id} by ${user.id}`);
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[ERROR] Customer Update Failed:", error);
    return NextResponse.json(
      { error: "Failed to update customer: " + error.message },
      { status: 500 }
    );
  }
}
