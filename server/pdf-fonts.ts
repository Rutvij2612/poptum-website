import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export const PDF_FONT_REGULAR = "NotoSans";
export const PDF_FONT_BOLD = "NotoSans-Bold";

function resolveInvoiceFontPath(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), "server", "assets", "fonts", filename),
    path.join(process.cwd(), "dist", "server", "assets", "fonts", filename),
    path.join(__dirname, "assets", "fonts", filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Register Noto Sans (Unicode, includes ₹). Returns false if fonts are missing. */
export function registerInvoiceFonts(
  doc: InstanceType<typeof PDFDocument>,
): boolean {
  const regular = resolveInvoiceFontPath("NotoSans-Regular.ttf");
  const bold = resolveInvoiceFontPath("NotoSans-Bold.ttf");
  if (!regular || !bold) {
    console.warn(
      "[PDF] Noto Sans fonts not found under server/assets/fonts; rupee symbol may not render",
    );
    return false;
  }
  doc.registerFont(PDF_FONT_REGULAR, regular);
  doc.registerFont(PDF_FONT_BOLD, bold);
  return true;
}
