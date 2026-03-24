import { prisma } from "./prisma";

export async function logAudit(params: {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "SUBMIT" | "REJECT";
  type?: "AUDIT" | "ERROR" | "SYSTEM";
  invoiceId?: number;
  details?: string;
  changes?: any;
}) {
  try {
    return await prisma.systemLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        type: params.type || "AUDIT",
        invoiceId: params.invoiceId,
        details: params.details,
        changes: params.changes,
      },
    });
  } catch (err) {
    console.error(`[AUDIT ERROR] Failed to record log:`, err);
    // Non-blocking but logged to console
  }
}

/**
 * Specifically for SRO 69 compliance: 
 * Every adjustment or cancellation MUST maintain logs.
 */
export async function auditInvoiceChange(
  userId: string, 
  invoiceId: number, 
  action: "UPDATE" | "DELETE", 
  oldData: any, 
  newData?: any
) {
  return logAudit({
    userId,
    invoiceId,
    action,
    type: "AUDIT",
    details: `Invoice ${action.toLowerCase()}d by user.`,
    changes: {
      before: oldData,
      after: newData || null
    }
  });
}
