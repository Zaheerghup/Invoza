import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

// GET all invoices for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        company: true,
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch (err: any) {
    console.error("Fetch Invoices Error:", err);
    return NextResponse.json({ error: `Failed to fetch invoices: ${err.message}` }, { status: 500 });
  }
}

// POST create a new invoice for current user
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, customerId, InvoiceDate, PaymentMode, InvoiceType, TaxYear, TaxMonth, items } = body;

    if (!companyId || !customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "companyId, customerId and items are required" },
        { status: 400 }
      );
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
        ItemName: (item.ItemName || "").trim() || (item.description ? item.description.slice(0, 50) : "Item"),
        description: item.description,
        accountId: item.accountId ? Number(item.accountId) : null,
        HSCode: item.HSCode ?? "",
        Quantity: qty,
        Rate: rate,
        TaxPct: taxPct,
        TaxAmount: taxAmount,
      };
    });

    const totalAmount = totalSaleValue + totalSalesTax;

    // Generate unique business invoice number
    const count = await prisma.invoice.count({
      where: { companyId: Number(companyId) }
    });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        companyId: Number(companyId),
        customerId: Number(customerId),
        invoiceNumber,
        InvoiceDate: InvoiceDate ? new Date(InvoiceDate) : new Date(),
        TotalAmount: totalAmount,
        SalesTax: totalSalesTax,
        FBR_Status: "PENDING",
        PaymentMode: PaymentMode || "1",
        InvoiceType: InvoiceType || "SI",
        TaxYear: TaxYear ? Number(TaxYear) : null,
        TaxMonth: TaxMonth ? Number(TaxMonth) : null,
        items: {
          create: processedItems,
        },
      },
      include: {
        company: true,
        customer: true,
        items: true,
      },
    });

    // Create system log
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        action: "Invoice Created",
        details: `Created invoice #${invoice.id} for amount ${totalAmount}`,
      },
    });

    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error("Create Invoice Error:", err);
    return NextResponse.json({ error: `Failed to create invoice: ${err.message}` }, { status: 500 });
  }
}
