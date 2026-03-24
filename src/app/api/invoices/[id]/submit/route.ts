import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitInvoiceToFBR, mapInvoiceToFBRPayload, isFBRSubmissionSuccess, extractFBRError } from "@/lib/fbr";
import { createClient } from "@/lib/supabase-server";

export async function POST(
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

    // Fetch invoice with all required relations
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: user.id },
      include: {
        company: true,
        customer: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or unauthorized" }, { status: 404 });
    }

    if (invoice.FBR_Status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Invoice already submitted to FBR", invoiceNumber: invoice.FBR_InvoiceNumber },
        { status: 400 }
      );
    }

    // Guard: company must have an API token
    if (!invoice.company.API_Token) {
      return NextResponse.json(
        { error: "No FBR API Token found. Please add it in Settings." },
        { status: 400 }
      );
    }

    // Build the FBR v1.12-compliant payload
    const fbrPayload = mapInvoiceToFBRPayload({
      InvoiceDate: invoice.InvoiceDate,
      InvoiceType: invoice.InvoiceType,
      company: {
        NTN: invoice.company.NTN,
        BusinessName: invoice.company.BusinessName,
        Province: invoice.company.Province,
        Address: invoice.company.Address,
      },
      customer: {
        CustomerName: invoice.customer.CustomerName,
        NTN_CNIC: invoice.customer.NTN_CNIC,
        Address: invoice.customer.Address,
        Province: (invoice.customer as any).Province ?? "Punjab",
        BuyerType: invoice.customer.BuyerType,
      },
      items: invoice.items.map((item) => ({
        ItemName: item.ItemName,
        description: item.description,
        HSCode: item.HSCode,
        UoM: (item as any).UoM ?? "Numbers, pieces, units",
        SaleType: (item as any).SaleType ?? "Goods at standard rate (default)",
        Quantity: item.Quantity,
        Rate: item.Rate,
        TaxPct: item.TaxPct,
        TaxAmount: item.TaxAmount,
        Discount: (item as any).Discount ?? 0,
        FurtherTax: (item as any).FurtherTax ?? 0,
      })),
    });

    // Submit to FBR API
    const fbrResponse = await submitInvoiceToFBR(fbrPayload, invoice.company.API_Token);
    const success = isFBRSubmissionSuccess(fbrResponse);

    if (success) {
      // All items validated — mark as SUBMITTED
      const fbrInvoiceNumber = fbrResponse.validationResponse?.invoiceStatuses?.[0]?.invoiceNo
        ?? fbrResponse.invoiceNumber
        ?? null;

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          FBR_Status: "SUBMITTED",
          FBR_InvoiceNumber: fbrInvoiceNumber,
          QRCodeData: fbrResponse.validationResponse?.statusCode ?? null,
        },
      });

      await prisma.systemLog.create({
        data: {
          userId: user.id,
          action: "FBR Submission Success",
          details: `Invoice #${invoiceId} submitted. FBR#: ${fbrInvoiceNumber}`,
        },
      });

      return NextResponse.json({
        success: true,
        invoiceNumber: fbrInvoiceNumber,
        invoice: updatedInvoice,
      });
    } else {
      // Extract human-readable error from per-item statuses
      const errorMessage = extractFBRError(fbrResponse);

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { FBR_Status: "FAILED" },
      });

      await prisma.systemLog.create({
        data: {
          userId: user.id,
          action: "FBR Submission Failed",
          details: `Invoice #${invoiceId} failed. ${errorMessage}`,
        },
      });

      return NextResponse.json(
        {
          success: false,
          statusCode: fbrResponse.validationResponse?.statusCode,
          message: errorMessage,
          invoiceStatuses: fbrResponse.validationResponse?.invoiceStatuses ?? [],
        },
        { status: 422 }
      );
    }
  } catch (err) {
    console.error("FBR submission error:", err);
    return NextResponse.json(
      { error: "Internal server error during FBR submission" },
      { status: 500 }
    );
  }
}
