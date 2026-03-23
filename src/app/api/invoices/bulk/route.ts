import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the user's default company (required for invoices natively)
    const company = await prisma.company.findFirst({
      where: { userId: user.id }
    });

    if (!company) {
      return NextResponse.json({ error: "No active company found for user to attach invoices to" }, { status: 400 });
    }

    const rows = await request.json();
    if (!Array.isArray(rows)) return NextResponse.json({ error: "Expected an array of CSV invoice rows" }, { status: 400 });

    // 1. Group rows by CustomerName + InvoiceDate
    const groupedInvoices: Record<string, any> = {};

    rows.forEach((row: any) => {
      const cName = (row.CustomerName || "").trim();
      const iDate = (row.InvoiceDate || new Date().toISOString().split('T')[0]).trim();
      if (!cName) return; // Skip invalid rows missing customer link

      const key = `${cName}_${iDate}`;
      if (!groupedInvoices[key]) {
        groupedInvoices[key] = {
          CustomerName: cName,
          InvoiceDate: iDate,
          PaymentMode: row.PaymentMode || "1",
          InvoiceType: row.InvoiceType || "SI",
          TaxYear: row.TaxYear,
          TaxMonth: row.TaxMonth,
          items: []
        };
      }

      // Add granular item
      const qty = Number(row.Quantity) || 1;
      const rate = Number(row.Rate) || 0;
      const taxPct = Number(row.TaxPct) || 18;
      
      groupedInvoices[key].items.push({
        ItemName: row.ItemName || "Item",
        Quantity: qty,
        Rate: rate,
        TaxPct: taxPct,
      });
    });

    const invoiceGroups = Object.values(groupedInvoices);
    if (invoiceGroups.length === 0) return NextResponse.json({ error: "No valid invoices parsed from the selected CSV." }, { status: 400 });

    let createdCount = 0;

    // Process each grouped nested invoice matrix
    for (const group of invoiceGroups) {
      
      let customer = await prisma.customer.findFirst({
        where: { userId: user.id, CustomerName: group.CustomerName }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: { userId: user.id, CustomerName: group.CustomerName, BuyerType: "Individual" }
        });
      }

      let totalSaleValue = 0;
      let totalSalesTax = 0;

      const processedItems = group.items.map((item: any) => {
        const saleValue = item.Quantity * item.Rate;
        const taxAmount = (saleValue * item.TaxPct) / 100;
        totalSaleValue += saleValue;
        totalSalesTax += taxAmount;
        return {
          ItemName: item.ItemName.slice(0, 50),
          Quantity: item.Quantity,
          Rate: item.Rate,
          TaxPct: item.TaxPct,
          TaxAmount: taxAmount,
        };
      });

      const totalAmount = totalSaleValue + totalSalesTax;

      // Sequential generic invoice numbering matching original router logic
      const count = await prisma.invoice.count({ where: { companyId: company.id } });
      const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

      // Create deeply nested Prisma object representing the massive array natively
      await prisma.invoice.create({
        data: {
          userId: user.id,
          companyId: company.id,
          customerId: customer.id,
          invoiceNumber,
          InvoiceDate: new Date(group.InvoiceDate),
          TotalAmount: totalAmount,
          SalesTax: totalSalesTax,
          FBR_Status: "PENDING",
          PaymentMode: String(group.PaymentMode),
          InvoiceType: String(group.InvoiceType),
          TaxYear: group.TaxYear ? Number(group.TaxYear) : null,
          TaxMonth: group.TaxMonth ? Number(group.TaxMonth) : null,
          items: {
            create: processedItems
          }
        }
      });
      createdCount++;
    }

    // System log
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        action: "Bulk Invoices Imported",
        details: `Safely imported ${createdCount} invoices from bulk CSV upload`,
      },
    });

    return NextResponse.json({ message: `Successfully structured and imported ${createdCount} new invoices`, count: createdCount });
  } catch (err: any) {
    console.error("Bulk Create Invoice Error:", err);
    return NextResponse.json({ error: `Failed to bulk import invoices: ${err.message}` }, { status: 500 });
  }
}
