import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

// DELETE an item/account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    
    // Ensure the item belongs to the user
    const item = await prisma.itemAccount.findFirst({
      where: {
        id: Number(resolvedParams.id),
        userId: user.id
      }
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Try to delete. Prisma will throw if it's referenced by invoices and we don't handle it
    // Wait, the relation is optional in InvoiceItem but currently not set to Cascade. 
    // Typically, we don't delete items if they are used to preserve historical invoices.
    
    const usedInInvoices = await prisma.invoiceItem.count({
      where: { accountId: item.id }
    });
    
    if (usedInInvoices > 0) {
      return NextResponse.json(
        { error: "Cannot delete an item or account that has been used in invoices." },
        { status: 400 }
      );
    }

    await prisma.itemAccount.delete({
      where: { id: item.id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
