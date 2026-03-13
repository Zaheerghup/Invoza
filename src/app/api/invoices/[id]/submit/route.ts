import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitInvoiceToFBR, mapInvoiceToFBRPayload } from "@/lib/fbr";
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

    // Fetch invoice with all relations and verify user ownership
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

    // Map invoice data to FBR format
    const fbrPayload = mapInvoiceToFBRPayload({
      InvoiceDate: invoice.InvoiceDate,
      TotalAmount: invoice.TotalAmount,
      SalesTax: invoice.SalesTax,
      PaymentMode: invoice.PaymentMode,
      InvoiceType: invoice.InvoiceType,
      customer: invoice.customer,
      items: invoice.items,
    });

    // Submit to FBR API
    const fbrResponse = await submitInvoiceToFBR(fbrPayload, invoice.company.API_Token);

    if (fbrResponse.statusCode === "00") {
      // Success - update invoice with FBR invoice number
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          FBR_Status: "SUBMITTED",
          FBR_InvoiceNumber: fbrResponse.invoiceNumber,
          QRCodeData: fbrResponse.qrCodeData ?? null,
        },
      });

      // Create system log
      await prisma.systemLog.create({
        data: {
          userId: user.id,
          action: "FBR Submission Success",
          details: `Invoice #${invoiceId} successfully submitted to FBR. FBR#: ${fbrResponse.invoiceNumber}`,
        },
      });

      return NextResponse.json({
        success: true,
        invoiceNumber: fbrResponse.invoiceNumber,
        invoice: updatedInvoice,
      });
    } else {
      // Failed - update status
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { FBR_Status: "FAILED" },
      });

      // Create system log
      await prisma.systemLog.create({
        data: {
          userId: user.id,
          action: "FBR Submission Failed",
          details: `Invoice #${invoiceId} submission failed. Code: ${fbrResponse.statusCode}, Message: ${fbrResponse.message}`,
        },
      });

      return NextResponse.json(
        {
          success: false,
          statusCode: fbrResponse.statusCode,
          message: fbrResponse.message || "FBR submission failed",
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
