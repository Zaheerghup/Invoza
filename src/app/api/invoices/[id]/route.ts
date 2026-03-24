import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

// GET a single invoice
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(id), userId: user.id },
      include: {
        company: true,
        customer: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// DELETE an invoice
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

    const { id } = await params;
    const invoiceId = Number(id);

    // Check if it's already submitted (might want to prevent deletion)
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: user.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.FBR_Status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Cannot delete an invoice that has already been submitted to FBR." },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}

// PATCH update an invoice
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoiceId = Number(id);
    const body = await request.json();
    const { companyId, customerId, InvoiceDate, PaymentMode, InvoiceType, items } = body;

    const existingInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: user.id },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existingInvoice.FBR_Status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Cannot edit an invoice that has already been submitted to FBR." },
        { status: 400 }
      );
    }

    // Auto-catalog missing item accounts securely during edits
    for (const item of items) {
      let finalAccountId = item.accountId ? Number(item.accountId) : null;
      const itemName = (item.ItemName || "").trim() || (item.description ? item.description.slice(0, 50) : "Item");

      if (!finalAccountId && itemName !== "Item") {
        let existingAccount = await prisma.itemAccount.findFirst({
          where: { companyId: Number(companyId), userId: user.id, name: itemName }
        });
        if (!existingAccount) {
          existingAccount = await prisma.itemAccount.create({
            data: {
              systemCode: `AUTO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              type: "Goods",
              name: itemName,
              description: item.description || "Auto-cataloged entry",
              userId: user.id,
              companyId: Number(companyId),
            }
          });
        }
        item.resolvedAccountId = existingAccount.id;
      } else {
        item.resolvedAccountId = finalAccountId;
      }
      item.resolvedItemName = itemName;
    }

    // Calculate totals
    let totalSaleValue = 0;
    let totalSalesTax = 0;

    const processedItems = items.map((item: any) => {
      const qty = Number(item.Quantity);
      const rate = Number(item.Rate);
      const taxPct = Number(item.TaxPct ?? 18);
      const saleValue = qty * rate;
      const taxAmount = (saleValue * taxPct) / 100;
      totalSaleValue += saleValue;
      totalSalesTax += taxAmount;
      return {
        ItemName: item.resolvedItemName,
        description: item.description || "",
        accountId: item.resolvedAccountId,
        HSCode: item.HSCode ?? "",
        UoM: item.UoM || "Numbers, pieces, units",
        SaleType: item.SaleType || "Goods at standard rate (default)",
        Quantity: qty,
        Rate: rate,
        TaxPct: taxPct,
        TaxAmount: taxAmount,
        Discount: Number(item.Discount) || 0,
        FurtherTax: Number(item.FurtherTax) || 0,
      };
    });

    const totalAmount = totalSaleValue + totalSalesTax;

    // Use a transaction to update
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId },
      });

      // Update invoice and recreate items
      return await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          companyId: Number(companyId),
          customerId: Number(customerId),
          InvoiceDate: InvoiceDate ? new Date(InvoiceDate) : new Date(),
          TotalAmount: totalAmount,
          SalesTax: totalSalesTax,
          PaymentMode: PaymentMode || "1",
          InvoiceType: InvoiceType || "SI",
          items: {
            create: processedItems,
          },
        },
        include: {
          items: true,
        },
      });
    });

    return NextResponse.json(updatedInvoice);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
