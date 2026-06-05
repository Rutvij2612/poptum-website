/** Checkout-only India GST display (same reverse-calc as server/gst.ts). */

import { isGujaratState } from "../../../shared/indian-states";
import { round2 } from "../../../shared/order-pricing";

const GST_INCLUSIVE_MULTIPLIER = 1.05;
const CGST_RATE = 0.025;

export type IndiaCheckoutGstDisplay =
  | { mode: "included"; gstIncluded: number; taxableValue: number }
  | { mode: "cgst_sgst"; taxableValue: number; cgst: number; sgst: number }
  | { mode: "igst"; taxableValue: number; igst: number };

function isGujaratPin(postalCode?: string | null): boolean {
  const pin = postalCode?.trim() ?? "";
  if (pin.length < 2) return false;
  return pin.startsWith("36") || pin.startsWith("37") || pin.startsWith("38");
}

/** True once state field or postal code can determine Gujarat vs non-Gujarat. */
export function isIndiaGstStateResolved(
  state?: string | null,
  postalCode?: string | null,
): boolean {
  if (state?.trim()) return true;
  const pin = postalCode?.trim() ?? "";
  return pin.length >= 2;
}

export function getIndiaCheckoutGstDisplay(
  grandTotalInclusive: number,
  state?: string | null,
  postalCode?: string | null,
): IndiaCheckoutGstDisplay {
  const grandTotal = round2(grandTotalInclusive);
  const taxableValue = round2(grandTotal / GST_INCLUSIVE_MULTIPLIER);

  if (!isIndiaGstStateResolved(state, postalCode)) {
    return {
      mode: "included",
      gstIncluded: round2(grandTotal - taxableValue),
      taxableValue,
    };
  }

  const trimmedState = state?.trim();
  const isGujarat = trimmedState
    ? isGujaratState(trimmedState)
    : isGujaratPin(postalCode);

  if (isGujarat) {
    const cgst = round2(taxableValue * CGST_RATE);
    const sgst = round2(grandTotal - taxableValue - cgst);
    return { mode: "cgst_sgst", taxableValue, cgst, sgst };
  }

  return {
    mode: "igst",
    taxableValue,
    igst: round2(grandTotal - taxableValue),
  };
}
