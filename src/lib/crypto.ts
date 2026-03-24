import { createHmac } from "crypto";

export function generateDigitalSignature(invoiceData: any, secret: string): string {
  // Create a canonical string of the critical data
  const payload = JSON.stringify({
    invoiceNumber: invoiceData.invoiceNumber,
    date: invoiceData.InvoiceDate,
    total: invoiceData.TotalAmount,
    tax: invoiceData.SalesTax,
    companyNTN: invoiceData.company?.NTN || "",
    customerNTN: invoiceData.customer?.NTN_CNIC || ""
  });

  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
    .toUpperCase();
}
