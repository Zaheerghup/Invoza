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

    // Auto-catalog missing item accounts seamlessly
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
        description: item.description,
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

    // Generate unique business invoice number
    const count = await prisma.invoice.count({
      where: { companyId: Number(companyId) }
    });
    // Resolve company and generate digital signature (SRO 69 Rule 4b)
    const company = await prisma.company.findUnique({ where: { id: Number(companyId) } });
    const { generateDigitalSignature } = await import("@/lib/crypto");
    const consumerNTN = (await prisma.customer.findUnique({ where: { id: Number(customerId) } }))?.NTN_CNIC;
    
    const digitalSignature = generateDigitalSignature({
      invoiceNumber,
      InvoiceDate: InvoiceDate || new Date(),
      TotalAmount: totalAmount,
      SalesTax: totalSalesTax,
      company: { NTN: company?.NTN },
      customer: { NTN_CNIC: consumerNTN }
    }, company?.API_Token || "secret");

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
        digitalSignature, // RULE 150R(4)(b)
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

    // Create detailed audit log (SRO 69 Rule 4g)
    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      userId: user.id,
      action: "CREATE",
      type: "AUDIT",
      invoiceId: invoice.id,
      details: `Created invoice ${invoiceNumber}`,
      changes: invoice
    });

    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error("Create Invoice Error:", err);
    return NextResponse.json({ error: `Failed to create invoice: ${err.message}` }, { status: 500 });
  }
}
