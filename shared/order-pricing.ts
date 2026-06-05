/** Single source of truth for India/Germany order pricing. */

// TEMP TESTING PRICE - revert ₹2 back to ₹150 before production deployment
export const INDIA_PACKET_PRICE_INR = 150;
// TEMP TESTING SHIPPING - revert ₹0 back to ₹100 before production deployment
export const INDIA_SHIPPING_INR = 100;
export const INDIA_BULK_DISCOUNT_INR = 51;
export const INDIA_DISCOUNT_MIN_PACKETS = 5;
export const INDIA_FREE_SHIPPING_MIN_PACKETS = 10;

export const GERMANY_PACKET_PRICE_EUR = 3.49;
export const GERMANY_BULK_DISCOUNT_EUR = 2.46;
export const GERMANY_DISCOUNT_MIN_PACKETS = 5;
export const GERMANY_SHIPPING_EUR = 11;
export const GERMANY_FREE_SHIPPING_MIN_PACKETS = 12;
export const GERMANY_VAT_RATE = 0.07;
const GERMANY_VAT_INCLUSIVE_MULTIPLIER = 1 + GERMANY_VAT_RATE;

/** First milestone position on 0–12 packet scale (for dual progress bar). */
export const GERMANY_PROGRESS_MARKER_A_PERCENT =
  (GERMANY_DISCOUNT_MIN_PACKETS / GERMANY_FREE_SHIPPING_MIN_PACKETS) * 100;

export type OrderPricingTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  delivery: number;
  shipping: number;
  grandTotal: number;
  totalPackets: number;
};

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatIndianRupee(amount: number): string {
  return `₹${round2(amount).toFixed(2)}`;
}

export function formatEuroAmount(amount: number): string {
  return `€${round2(amount).toFixed(2)}`;
}

export function countTotalPackets(items: { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getPacketUnitPrice(country?: string | null): number {
  return country === "India" ? INDIA_PACKET_PRICE_INR : GERMANY_PACKET_PRICE_EUR;
}

export function calculateIndiaOrderPricing(totalPackets: number): OrderPricingTotals {
  const productTotal = totalPackets * INDIA_PACKET_PRICE_INR;
  const discount =
    totalPackets >= INDIA_DISCOUNT_MIN_PACKETS ? INDIA_BULK_DISCOUNT_INR : 0;
  const shipping =
    totalPackets >= INDIA_FREE_SHIPPING_MIN_PACKETS ? 0 : INDIA_SHIPPING_INR;
  const grandTotal = productTotal - discount + shipping;

  return {
    subtotal: productTotal,
    discount,
    tax: 0,
    delivery: 0,
    shipping,
    grandTotal,
    totalPackets,
  };
}

export type GermanyVatBreakdown = {
  taxableValue: number;
  vat: number;
  grandTotal: number;
};

/** Reverse-calculate 7% VAT from a VAT-inclusive grand total (Germany only). */
export function calculateGermanyVatFromInclusiveTotal(
  grandTotalInclusive: number,
): GermanyVatBreakdown {
  const grandTotal = round2(grandTotalInclusive);
  const taxableValue = round2(grandTotal / GERMANY_VAT_INCLUSIVE_MULTIPLIER);
  const vat = round2(grandTotal - taxableValue);
  return { taxableValue, vat, grandTotal };
}

export function calculateGermanyOrderPricing(totalPackets: number): OrderPricingTotals {
  const productTotal = round2(totalPackets * GERMANY_PACKET_PRICE_EUR);
  const discount =
    totalPackets >= GERMANY_DISCOUNT_MIN_PACKETS ? GERMANY_BULK_DISCOUNT_EUR : 0;
  const shipping =
    totalPackets >= GERMANY_FREE_SHIPPING_MIN_PACKETS ? 0 : GERMANY_SHIPPING_EUR;
  const grandTotal = round2(productTotal - discount + shipping);
  const vatBreakdown = calculateGermanyVatFromInclusiveTotal(grandTotal);

  return {
    subtotal: productTotal,
    discount,
    tax: vatBreakdown.vat,
    delivery: 0,
    shipping,
    grandTotal,
    totalPackets,
  };
}

export function calculateOrderPricing(
  items: { quantity: number; unitPrice?: number }[],
  country?: string | null,
): OrderPricingTotals {
  const totalPackets = countTotalPackets(items);
  if (country === "India") {
    return calculateIndiaOrderPricing(totalPackets);
  }
  return calculateGermanyOrderPricing(totalPackets);
}

export type IndiaCartProgressPhase =
  | "discount"
  | "discount_unlocked"
  | "free_shipping"
  | "free_shipping_unlocked";

export type IndiaCartProgress = {
  phase: IndiaCartProgressPhase;
  message: string;
  note?: string;
  progressPercent: number;
};

export function getIndiaCartProgress(totalPackets: number): IndiaCartProgress {
  if (totalPackets >= INDIA_FREE_SHIPPING_MIN_PACKETS) {
    return {
      phase: "free_shipping_unlocked",
      message: "🎉 Free shipping unlocked.",
      progressPercent: 100,
    };
  }

  if (totalPackets === INDIA_DISCOUNT_MIN_PACKETS) {
    return {
      phase: "discount_unlocked",
      message: "🎉 Yay! ₹51 discount unlocked.",
      progressPercent: 0,
    };
  }

  if (totalPackets > INDIA_DISCOUNT_MIN_PACKETS) {
    const remaining =
      (INDIA_FREE_SHIPPING_MIN_PACKETS - totalPackets) * INDIA_PACKET_PRICE_INR;
    return {
      phase: "free_shipping",
      message: `You're ₹${remaining} away from FREE SHIPPING 🚚`,
      progressPercent:
        ((totalPackets - INDIA_DISCOUNT_MIN_PACKETS) /
          (INDIA_FREE_SHIPPING_MIN_PACKETS - INDIA_DISCOUNT_MIN_PACKETS)) *
        100,
    };
  }

  const remaining =
    (INDIA_DISCOUNT_MIN_PACKETS - totalPackets) * INDIA_PACKET_PRICE_INR;
  return {
    phase: "discount",
    message: `You're ₹${remaining} away from ₹51 OFF ★`,
    note: "Shipping charges may apply.",
    progressPercent: (totalPackets / INDIA_DISCOUNT_MIN_PACKETS) * 100,
  };
}

export type GermanyCartProgressPhase =
  | "discount"
  | "discount_unlocked"
  | "free_shipping"
  | "free_shipping_unlocked";

export type GermanyCartProgress = {
  phase: GermanyCartProgressPhase;
  message: string;
  note?: string;
  /** Progress within the current phase segment (0–100). */
  progressPercent: number;
  /** Fill across the full 0–12 dual-milestone bar (0–100). */
  overallFillPercent: number;
  markerAPercent: number;
  firstMilestoneComplete: boolean;
  secondMilestoneComplete: boolean;
};

export function getGermanyDualMilestoneFill(totalPackets: number): number {
  const markerA = GERMANY_PROGRESS_MARKER_A_PERCENT;
  if (totalPackets <= 0) return 0;
  if (totalPackets >= GERMANY_FREE_SHIPPING_MIN_PACKETS) return 100;
  if (totalPackets <= GERMANY_DISCOUNT_MIN_PACKETS) {
    return (totalPackets / GERMANY_DISCOUNT_MIN_PACKETS) * markerA;
  }
  const phase2Span = 100 - markerA;
  const packetsIntoPhase2 = totalPackets - GERMANY_DISCOUNT_MIN_PACKETS;
  const phase2Total =
    GERMANY_FREE_SHIPPING_MIN_PACKETS - GERMANY_DISCOUNT_MIN_PACKETS;
  return markerA + (packetsIntoPhase2 / phase2Total) * phase2Span;
}

export function getGermanyCartProgress(totalPackets: number): GermanyCartProgress {
  const markerAPercent = GERMANY_PROGRESS_MARKER_A_PERCENT;
  const overallFillPercent = getGermanyDualMilestoneFill(totalPackets);
  const firstMilestoneComplete = totalPackets >= GERMANY_DISCOUNT_MIN_PACKETS;
  const secondMilestoneComplete = totalPackets >= GERMANY_FREE_SHIPPING_MIN_PACKETS;

  if (secondMilestoneComplete) {
    return {
      phase: "free_shipping_unlocked",
      message: "🎉 FREE SHIPPING applied!",
      progressPercent: 100,
      overallFillPercent: 100,
      markerAPercent,
      firstMilestoneComplete: true,
      secondMilestoneComplete: true,
    };
  }

  if (totalPackets === GERMANY_DISCOUNT_MIN_PACKETS) {
    return {
      phase: "discount_unlocked",
      message: "🎉 Yay! €2.46 OFF applied!",
      progressPercent: 0,
      overallFillPercent,
      markerAPercent,
      firstMilestoneComplete: true,
      secondMilestoneComplete: false,
    };
  }

  if (totalPackets > GERMANY_DISCOUNT_MIN_PACKETS) {
    const remaining = round2(
      (GERMANY_FREE_SHIPPING_MIN_PACKETS - totalPackets) * GERMANY_PACKET_PRICE_EUR,
    );
    return {
      phase: "free_shipping",
      message: `You're ${formatEuroAmount(remaining)} away from FREE SHIPPING 🚚`,
      progressPercent:
        ((totalPackets - GERMANY_DISCOUNT_MIN_PACKETS) /
          (GERMANY_FREE_SHIPPING_MIN_PACKETS - GERMANY_DISCOUNT_MIN_PACKETS)) *
        100,
      overallFillPercent,
      markerAPercent,
      firstMilestoneComplete: true,
      secondMilestoneComplete: false,
    };
  }

  const remaining = round2(
    (GERMANY_DISCOUNT_MIN_PACKETS - totalPackets) * GERMANY_PACKET_PRICE_EUR,
  );
  return {
    phase: "discount",
    message: `You're ${formatEuroAmount(remaining)} away from €2.46 OFF ★`,
    note: "Shipping charges may apply.",
    progressPercent: (totalPackets / GERMANY_DISCOUNT_MIN_PACKETS) * 100,
    overallFillPercent,
    markerAPercent,
    firstMilestoneComplete: false,
    secondMilestoneComplete: false,
  };
}

export function formatIndiaOrderEconomicsLines(totals: OrderPricingTotals): string[] {
  const lines = [`Products: ${formatIndianRupee(totals.subtotal)}`];
  if (totals.discount > 0) {
    lines.push(`Discount: -${formatIndianRupee(totals.discount)}`);
  }
  lines.push(
    `Shipping: ${
      totals.shipping === 0 ? "FREE" : formatIndianRupee(totals.shipping)
    }`,
  );
  lines.push(`Grand Total: ${formatIndianRupee(totals.grandTotal)}`);
  return lines;
}

export function formatGermanyOrderEconomicsLines(totals: OrderPricingTotals): string[] {
  const lines = [`Products: ${formatEuroAmount(totals.subtotal)}`];
  if (totals.discount > 0) {
    lines.push(`Discount: -${formatEuroAmount(totals.discount)}`);
  }
  lines.push(
    `Shipping: ${totals.shipping === 0 ? "FREE" : formatEuroAmount(totals.shipping)}`,
  );
  lines.push(`Grand Total: ${formatEuroAmount(totals.grandTotal)}`);
  return lines;
}
