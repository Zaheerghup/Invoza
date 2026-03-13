/**
 * FBR API Integration Utility
 * Compliant with S.R.O. 709(I)/2025
 * Endpoint: https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata
 */

export interface FBRInvoiceItem {
  itemName: string;
  hsCode: string;
  quantity: number;
  rate: number;
  taxPct: number;
  taxAmount: number;
  totalAmount: number;
}

export interface FBRInvoicePayload {
  buyerNTN: string;
  buyerCNIC: string;
  buyerName: string;
  buyerAddress: string;
  buyerType: string;
  invoiceDate: string; // YYYY-MM-DD
  totalBillAmount: number;
  totalSaleValue: number;
  totalTaxCharged: number;
  invoiceType: string;
  paymentMode: string;
  items: FBRInvoiceItem[];
}

export interface FBRResponse {
  statusCode: string;
  invoiceNumber?: string;
  message?: string;
  qrCodeData?: string;
}

const FBR_ENDPOINT =
  "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata";

/**
 * Submit an invoice to the FBR API
 * @param payload - The invoice data formatted for FBR
 * @param apiToken - The Bearer token from Company settings
 * @returns FBRResponse
 */
export async function submitInvoiceToFBR(
  payload: FBRInvoicePayload,
  apiToken: string
): Promise<FBRResponse> {
  const response = await fetch(FBR_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      statusCode: String(response.status),
      message: `HTTP Error: ${response.status} - ${errorText}`,
    };
  }

  const data = await response.json();
  return data as FBRResponse;
}

/**
 * Map database invoice to FBR payload format
 */
export function mapInvoiceToFBRPayload(invoice: {
  InvoiceDate: Date;
  TotalAmount: number;
  SalesTax: number;
  PaymentMode: string;
  InvoiceType: string;
  customer: {
    CustomerName: string;
    NTN_CNIC: string | null;
    Address: string | null;
    BuyerType: string;
  };
  items: Array<{
    ItemName: string;
    HSCode: string | null;
    Quantity: number;
    Rate: number;
    TaxPct: number;
    TaxAmount: number;
  }>;
}): FBRInvoicePayload {
  const isBusiness = invoice.customer.BuyerType === "Business";

  return {
    buyerNTN: isBusiness ? (invoice.customer.NTN_CNIC ?? "") : "",
    buyerCNIC: !isBusiness ? (invoice.customer.NTN_CNIC ?? "") : "",
    buyerName: invoice.customer.CustomerName,
    buyerAddress: invoice.customer.Address ?? "",
    buyerType: invoice.customer.BuyerType,
    invoiceDate: invoice.InvoiceDate.toISOString().split("T")[0],
    totalBillAmount: invoice.TotalAmount,
    totalSaleValue: invoice.TotalAmount - invoice.SalesTax,
    totalTaxCharged: invoice.SalesTax,
    invoiceType: invoice.InvoiceType,
    paymentMode: invoice.PaymentMode,
    items: invoice.items.map((item) => ({
      itemName: item.ItemName,
      hsCode: item.HSCode ?? "",
      quantity: item.Quantity,
      rate: item.Rate,
      taxPct: item.TaxPct,
      taxAmount: item.TaxAmount,
      totalAmount: item.Quantity * item.Rate + item.TaxAmount,
    })),
  };
}
