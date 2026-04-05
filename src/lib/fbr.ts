/**
 * FBR Digital Invoicing API Integration Utility
 * Compliant with Technical Specification for DI API v1.12 (PRAL/FBR)
 * Post endpoint:     https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata
 * Validate endpoint: https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata
 */

// ─── Invoice Type Mapping ─────────────────────────────────────────────────────
const INVOICE_TYPE_MAP: Record<string, string> = {
  SI: "Sale Invoice",
  DN: "Debit Note",
  CN: "Credit Note",
};

// ─── Registration Type Mapping ────────────────────────────────────────────────
// FBR only accepts "Registered" or "Unregistered"
function mapRegistrationType(buyerType: string): string {
  const t = buyerType.toLowerCase();
  if (t === "registered" || t === "business" || t === "company") return "Registered";
  return "Unregistered";
}

// ─── FBR JSON Payload Types (v1.12) ───────────────────────────────────────────
export interface FBRItemPayload {
  hsCode: string;
  productDescription: string;
  rate: string;                          // e.g. "18%"
  uoM: string;                           // e.g. "Numbers, pieces, units"
  quantity: number;
  totalValues: number;                   // total including tax
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  saleType: string;                      // e.g. "Goods at standard rate (default)"
  sroItemSerialNo: string;
}

export interface FBRInvoicePayload {
  invoiceType: string;                   // "Sale Invoice" | "Debit Note"
  invoiceDate: string;                   // YYYY-MM-DD
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;         // "Registered" | "Unregistered"
  invoiceRefNo: string;
  items: FBRItemPayload[];
}

// ─── FBR Response Types ───────────────────────────────────────────────────────
export interface FBRItemStatus {
  itemSNo: string;
  statusCode: string;
  status: string;
  invoiceNo: string | null;
  errorCode: string;
  error: string;
}

export interface FBRValidationResponse {
  statusCode: string;
  status: string;
  errorCode?: string | null;
  error: string;
  invoiceStatuses: FBRItemStatus[] | null;
}

export interface FBRResponse {
  invoiceNumber?: string;
  dated?: string;
  validationResponse: FBRValidationResponse;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────
const FBR_POST_URL = "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata";
const FBR_VALIDATE_URL = "https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata";

// ─── API Calls ────────────────────────────────────────────────────────────────
export async function submitInvoiceToFBR(
  payload: FBRInvoicePayload,
  apiToken: string,
  apiUrl?: string
): Promise<FBRResponse> {
  const endpoint = apiUrl || FBR_POST_URL;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      validationResponse: {
        statusCode: String(response.status),
        status: "Invalid",
        error: `HTTP ${response.status}: ${JSON.stringify(data)}`,
        invoiceStatuses: null,
      },
    };
  }

  return data as FBRResponse;
}

export async function validateInvoiceWithFBR(
  payload: FBRInvoicePayload,
  apiToken: string
): Promise<FBRResponse> {
  const response = await fetch(FBR_VALIDATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data as FBRResponse;
}

// ─── Payload Builder ──────────────────────────────────────────────────────────
export function mapInvoiceToFBRPayload(invoice: {
  InvoiceDate: Date;
  InvoiceType: string;
  company: {
    NTN: string;
    BusinessName: string;
    Province: string;
    Address: string;
  };
  customer: {
    CustomerName: string;
    NTN_CNIC: string | null;
    Address: string | null;
    Province: string;
    BuyerType: string;
  };
  items: Array<{
    ItemName: string;
    description: string | null;
    HSCode: string | null;
    UoM: string;
    SaleType: string;
    Quantity: number;
    Rate: number;
    TaxPct: number;
    TaxAmount: number;
    Discount: number;
    FurtherTax: number;
  }>;
}): FBRInvoicePayload {
  const registrationType = mapRegistrationType(invoice.customer.BuyerType);
  const isUnregistered = registrationType === "Unregistered";

  return {
    invoiceType: INVOICE_TYPE_MAP[invoice.InvoiceType] ?? "Sale Invoice",
    invoiceDate: invoice.InvoiceDate.toISOString().split("T")[0],
    sellerNTNCNIC: invoice.company.NTN,
    sellerBusinessName: invoice.company.BusinessName,
    sellerProvince: invoice.company.Province,
    sellerAddress: invoice.company.Address,
    buyerNTNCNIC: invoice.customer.NTN_CNIC ?? "",
    buyerBusinessName: invoice.customer.CustomerName,
    buyerProvince: invoice.customer.Province,
    buyerAddress: invoice.customer.Address ?? "",
    buyerRegistrationType: registrationType,
    invoiceRefNo: "",
    items: invoice.items.map((item) => {
      const saleValue = item.Quantity * item.Rate;
      const taxAmount = item.TaxAmount;
      const totalValues = saleValue + taxAmount;
      // FBR: 3% further tax for unregistered buyers (if not already set)
      const furtherTax =
        item.FurtherTax > 0
          ? item.FurtherTax
          : isUnregistered
          ? parseFloat((saleValue * 0.03).toFixed(2))
          : 0;

      return {
        hsCode: item.HSCode ?? "",
        productDescription: item.description || item.ItemName,
        rate: `${item.TaxPct}%`,
        uoM: item.UoM,
        quantity: item.Quantity,
        totalValues,
        valueSalesExcludingST: saleValue,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: taxAmount,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax,
        sroScheduleNo: "",
        fedPayable: 0,
        discount: item.Discount,
        saleType: item.SaleType,
        sroItemSerialNo: "",
      };
    }),
  };
}

// ─── Response Helper ──────────────────────────────────────────────────────────
/**
 * Checks if the FBR response indicates a fully successful submission.
 * Both the header AND every individual item status must be "00".
 */
export function isFBRSubmissionSuccess(response: FBRResponse): boolean {
  const vr = response.validationResponse;
  if (!vr || vr.statusCode !== "00") return false;
  if (!vr.invoiceStatuses || vr.invoiceStatuses.length === 0) return false;
  return vr.invoiceStatuses.every((item) => item.statusCode === "00");
}

/**
 * Extracts a human-readable error summary from an FBR response.
 */
export function extractFBRError(response: FBRResponse): string {
  const vr = response.validationResponse;
  if (!vr) return "Unknown FBR error";
  if (vr.error) return vr.error;
  if (vr.invoiceStatuses) {
    const failed = vr.invoiceStatuses.filter((i) => i.statusCode !== "00");
    if (failed.length > 0) {
      return failed
        .map((i) => `Item ${i.itemSNo}: [${i.errorCode}] ${i.error}`)
        .join("; ");
    }
  }
  return `Status ${vr.statusCode}: ${vr.status}`;
}

// ─── Reference Data Sync ──────────────────────────────────────────────────────
/**
 * Fetches reference data from FBR endpoints.
 * Assuming standard endpoints. User/System can adjust these paths if FBR updates them.
 */
export async function fetchFbrReferenceList(
  apiUrl: string,
  apiToken: string,
  listType: string
): Promise<Array<{ code: string; name: string }>> {
  // Extract base URL if the user provided the exact POST URL in settings
  const baseUrl = apiUrl.replace(/\/postinvoicedata/i, "").replace(/\/validateinvoicedata/i, "").replace(/\/$/, "");

  let endpoint = "";
  if (listType === "PROVINCE") endpoint = "/GetProvinces";
  else if (listType === "DOC_TYPE") endpoint = "/GetDocumentTypes";
  else if (listType === "UOM") endpoint = "/GetUOMs";
  else if (listType === "HS_CODE") endpoint = "/GetHSCodes";

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      // Timeout added to prevent halting if FBR is down
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn(`[FBR Sync] Failed to fetch ${listType}. Status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // Attempt standard mapping. Data shape may vary: { data: [...] } or just [...]
    const list = Array.isArray(data) ? data : (data.data || data.items || []);
    
    return list.map((item: any) => ({
      code: String(item.Code || item.code || item.Id || item.id || item.Name || item.name || ""),
      name: String(item.Name || item.name || item.Description || item.description || "")
    })).filter((i: any) => i.code && i.name);
  } catch (err) {
    console.error(`[FBR Sync] Network/Parsing error for ${listType}:`, err);
    return [];
  }
}

