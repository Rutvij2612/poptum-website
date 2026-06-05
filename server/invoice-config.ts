import fs from "fs";
import path from "path";

/** HSN for all makhana products on tax invoice. */
export const INVOICE_HSN_CODE = "20081929";

export const INVOICE_COMPANY = {
  brand: "POPTUM",
  tagline: "Pop • Crunch • Repeat",
  legalName: "MOFORCE EXIM",
  brandOf: "A Brand of MOFORCE EXIM",
  addressLines: [
    "BLOCK NO C-3-6,",
    "RADHA PARK, ROYAL PARK HAVELI STREET,",
    "B/H WHITE HOUSE,",
    "KALAVAD ROAD,",
    "RAJKOT - 360005,",
    "GUJARAT, INDIA",
  ],
  email: "info.poptum@gmail.com",
  phone: "+91 9601061178",
  gstin: "24ABCFM0140J1ZQ",
  fssai: "10725998001070",
};

export const INVOICE_DECLARATION =
  "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";

export const INVOICE_TERMS = [
  "Goods once sold will not be taken back.",
  "Subject to Rajkot, Gujarat jurisdiction only.",
  "Any dispute shall be governed by the laws of India.",
  "This is a computer generated invoice.",
  "Product quality concerns must be reported within 48 hours of delivery.",
];

/**
 * Optional separate stamp/signature images (set paths when available).
 * Combined stamp+signature image is used when these are null.
 */
export const INVOICE_STAMP_IMAGE_PATH: string | null = null;
export const INVOICE_SIGNATURE_IMAGE_PATH: string | null = null;

/** Combined stamp + signature (current asset). */
export const INVOICE_STAMP_SIGN_IMAGE_FILENAME = "stamp_sign.png";
export const INVOICE_LOGO_FILENAME = "poptum_logo.png";
export const INVOICE_LOGO_FALLBACK_FILENAME = "poptumlogo.png";

export function resolveInvoiceAssetPath(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), "client", "public", filename),
    path.join(process.cwd(), "dist", "public", filename),
    path.join(__dirname, "..", "client", "public", filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Primary logo first, then alternate filename in the same public folders. */
export function resolveInvoiceLogoPath(): string | null {
  return (
    resolveInvoiceAssetPath(INVOICE_LOGO_FILENAME) ??
    resolveInvoiceAssetPath(INVOICE_LOGO_FALLBACK_FILENAME)
  );
}
