import { INDIA_PACKET_PRICE_INR } from "../../../shared/order-pricing";

export type UserCountry = "India" | "Germany";

export const EUR_TO_INR = 1;

function normalizeCountry(value?: string | null): UserCountry {
  return value === "India" ? "India" : "Germany";
}

export function convertEurToInr(amountEur: number) {
  return amountEur * EUR_TO_INR;
}

export function formatEuro(amount: number) {
  return `€${(Math.round(amount * 100) / 100).toFixed(2)}`;
}

export function formatRupee(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceByCountry(amount: number, country?: string | null) {
  const normalized = normalizeCountry(country);
  if (normalized === "India") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return formatEuro(amount);
}

export function formatDualPrice(amountEur: number) {
  return `${formatEuro(amountEur)} / ${formatRupee(convertEurToInr(amountEur))}`;
}

/** Guest catalogue label: Germany €3.49 / India per packet. */
export function formatDualFlavourPrice() {
  return `${formatRupee(INDIA_PACKET_PRICE_INR)} / ${formatEuro(3.49)}`;
}

/** Guest cart footer payable (products − one-time bulk discount, no shipping). */
export function formatDualFooterPayable(totalPackets: number): string {
  const indiaDiscount = totalPackets >= 5 ? 51 : 0;
  const germanyDiscount = totalPackets >= 5 ? 2.46 : 0;
  const indiaTotal = totalPackets * INDIA_PACKET_PRICE_INR - indiaDiscount;
  const germanyTotal = Math.round((totalPackets * 3.49 - germanyDiscount) * 100) / 100;
  return `${formatRupee(indiaTotal)} / ${formatEuro(germanyTotal)}`;
}

/** Guest line total for a given quantity (products only, no discount). */
export function formatDualLineTotal(quantity: number) {
  return `${formatRupee(INDIA_PACKET_PRICE_INR * quantity)} / ${formatEuro(3.49 * quantity)}`;
}

/** @deprecated Use formatDualFooterPayable for cart footer totals. */
export function formatDualProductTotal(totalPackets: number) {
  return formatDualFooterPayable(totalPackets);
}

export function getCountryOrDefault(country?: string | null): UserCountry {
  return normalizeCountry(country);
}
