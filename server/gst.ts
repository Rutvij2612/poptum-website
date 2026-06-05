/** GST-inclusive pricing: reverse-calculate tax from amount paid (India only). */

import { isGujaratState } from "../shared/indian-states";
import {
  formatIndianRupee,
  formatIndiaOrderEconomicsLines,
  round2,
  type OrderPricingTotals,
} from "../shared/order-pricing";

export { formatIndianRupee, round2 } from "../shared/order-pricing";

export const GST_INCLUSIVE_RATE = 0.05;
export const CGST_RATE = 0.025;
export const SGST_RATE = 0.025;
const GST_INCLUSIVE_MULTIPLIER = 1 + GST_INCLUSIVE_RATE;

export type IndiaGstScheme = "cgst_sgst" | "igst";

export type GstStateResolutionSource = "state" | "pin_fallback" | "default_igst";

export interface GstOrderContext {
  country: string;
  state?: string | null;
  postalCode?: string | null;
}

export interface IndiaGstBreakdown {
  scheme: IndiaGstScheme;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  customerState: string;
  stateResolution: GstStateResolutionSource;
}

export function isIndiaOrder(country?: string | null): boolean {
  return country === "India";
}

/** Gujarat PIN prefixes (legacy orders without state). */
function isGujaratPin(postalCode?: string | null): boolean {
  const pin = postalCode?.trim() ?? "";
  if (pin.length < 2) return false;
  return pin.startsWith("36") || pin.startsWith("37") || pin.startsWith("38");
}

/**
 * Resolve shipping state for GST. Primary: customer state field.
 * Fallback: Gujarat PIN prefixes 36/37/38; else default to IGST.
 */
export function resolveIndiaShippingState(
  context: GstOrderContext,
): { state: string; source: GstStateResolutionSource } {
  const trimmedState = context.state?.trim();
  if (trimmedState) {
    return { state: trimmedState, source: "state" };
  }

  console.log("[GST] State unavailable, using PIN fallback");

  if (isGujaratPin(context.postalCode)) {
    return { state: "Gujarat", source: "pin_fallback" };
  }

  return { state: "—", source: "default_igst" };
}

function logGstBreakdown(breakdown: IndiaGstBreakdown): void {
  console.log("[GST] Taxable Value:", breakdown.taxableValue);
  console.log("[GST] CGST:", breakdown.cgst);
  console.log("[GST] SGST:", breakdown.sgst);
  console.log("[GST] IGST:", breakdown.igst);
  console.log("[GST] Grand Total:", breakdown.grandTotal);
  console.log("[GST] Customer State:", breakdown.customerState);
  console.log("[GST] State resolution:", breakdown.stateResolution);
}

/**
 * Reverse-calculate GST from a GST-inclusive grand total (India only).
 * Gujarat state → CGST + SGST; all other India → IGST.
 */
export function calculateIndiaGstFromInclusiveTotal(
  grandTotalInclusive: number,
  context: GstOrderContext,
): IndiaGstBreakdown | null {
  if (!isIndiaOrder(context.country)) {
    return null;
  }

  const { state, source } = resolveIndiaShippingState(context);
  const grandTotal = round2(grandTotalInclusive);
  const taxableValue = round2(grandTotal / GST_INCLUSIVE_MULTIPLIER);

  if (isGujaratState(state)) {
    const cgst = round2(taxableValue * CGST_RATE);
    const sgst = round2(grandTotal - taxableValue - cgst);
    const breakdown: IndiaGstBreakdown = {
      scheme: "cgst_sgst",
      taxableValue,
      cgst,
      sgst,
      igst: 0,
      grandTotal,
      customerState: state,
      stateResolution: source,
    };
    logGstBreakdown(breakdown);
    return breakdown;
  }

  const igst = round2(grandTotal - taxableValue);
  const breakdown: IndiaGstBreakdown = {
    scheme: "igst",
    taxableValue,
    cgst: 0,
    sgst: 0,
    igst,
    grandTotal,
    customerState: state,
    stateResolution: source,
  };
  logGstBreakdown(breakdown);
  return breakdown;
}

function formatIndiaGstDetailLines(indiaGst: IndiaGstBreakdown): string[] {
  const lines = [
    `Subtotal (Taxable Value): ${formatIndianRupee(indiaGst.taxableValue)}`,
  ];
  if (indiaGst.scheme === "cgst_sgst") {
    lines.push(`CGST (2.5%): ${formatIndianRupee(indiaGst.cgst)}`);
    lines.push(`SGST (2.5%): ${formatIndianRupee(indiaGst.sgst)}`);
  } else {
    lines.push(`IGST (5%): ${formatIndianRupee(indiaGst.igst)}`);
  }
  return lines;
}

export function formatIndiaCustomerPricingBlock(args: {
  orderTotals: OrderPricingTotals;
  indiaGst: IndiaGstBreakdown;
  delivery: number;
  paymentMethod: string;
  language: "en" | "de";
}): string {
  const { orderTotals, indiaGst, delivery, paymentMethod, language } = args;
  const lines: string[] = ["Pricing:", ...formatIndiaOrderEconomicsLines(orderTotals), ""];
  lines.push(...formatIndiaGstDetailLines(indiaGst));
  if (delivery > 0) {
    lines.push(`Delivery: ${formatIndianRupee(delivery)}`);
  }
  lines.push("");
  lines.push(`Grand Total: ${formatIndianRupee(indiaGst.grandTotal)}`);
  const pmLabel = language === "de" ? "Zahlungsart" : "Payment Method";
  lines.push(`${pmLabel}: ${paymentMethod}`);
  return lines.join("\n");
}

export function formatIndiaAdminOrderSummaryBlock(args: {
  orderTotals: OrderPricingTotals;
  indiaGst: IndiaGstBreakdown;
  delivery: number;
  paymentMethod: string;
}): string {
  const { orderTotals, indiaGst, delivery, paymentMethod } = args;
  const lines: string[] = [
    ...formatIndiaOrderEconomicsLines(orderTotals),
    "",
    ...formatIndiaGstDetailLines(indiaGst),
  ];
  if (delivery > 0) {
    lines.push(`Delivery: ${formatIndianRupee(delivery)}`);
  }
  lines.push("");
  lines.push(`GRAND TOTAL: ${formatIndianRupee(indiaGst.grandTotal)}`);
  lines.push(`Payment Method: ${paymentMethod}`);
  return lines.join("\n");
}
