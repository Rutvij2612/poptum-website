import fs from "fs";
import PDFDocument from "pdfkit";
import type { IndiaGstBreakdown } from "./gst";
import { formatIndianRupee, isIndiaOrder } from "./gst";
import { amountInWordsINR } from "./amount-in-words";
import {
  INVOICE_COMPANY,
  INVOICE_DECLARATION,
  INVOICE_HSN_CODE,
  resolveInvoiceLogoPath,
  INVOICE_SIGNATURE_IMAGE_PATH,
  INVOICE_STAMP_IMAGE_PATH,
  INVOICE_STAMP_SIGN_IMAGE_FILENAME,
  INVOICE_TERMS,
  resolveInvoiceAssetPath,
} from "./invoice-config";
import { getOrAllocateInvoiceNumber } from "./invoice-number";
import { PDF_FONT_BOLD, PDF_FONT_REGULAR, registerInvoiceFonts } from "./pdf-fonts";

const PAGE_MARGIN = 36;
const PAGE_HEIGHT = 841.89;
const PAGE_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN - 8;
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2;
const FOOTER_BLOCK_HEIGHT = 46;
const FOOTER_TOP_Y = PAGE_BOTTOM - FOOTER_BLOCK_HEIGHT;
const TABLE_RIGHT = PAGE_MARGIN + CONTENT_WIDTH;
const LOGO_WIDTH = 72;
const LOGO_TOP_PAD = 6;
const LOGO_BLOCK_HEIGHT = 56;

interface InvoiceData {
  orderId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  state?: string | null;
  country: string;
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
  subtotal: number;
  tax: number;
  delivery: number;
  shipping: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  date: Date;
  discount?: number;
  indiaGst?: IndiaGstBreakdown;
}

/** Single-page retail invoice — do not add overflow pages. */
function advanceY(y: number, _needed: number): number {
  return y;
}

/** Keep flowing text on page 1 — PDFKit otherwise auto-adds pages. */
function boundedText(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  x: number,
  y: number,
  width: number,
  maxHeight: number,
  options?: { lineGap?: number },
) {
  doc.text(text, x, y, {
    width,
    height: Math.max(maxHeight, 8),
    lineGap: options?.lineGap ?? 0,
  });
  return y + Math.min(doc.heightOfString(text, { width, lineGap: options?.lineGap }), maxHeight);
}

function drawImageIfExists(
  doc: InstanceType<typeof PDFDocument>,
  filePath: string | null,
  x: number,
  y: number,
  width: number,
) {
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    doc.image(filePath, x, y, { width });
  } catch {
    // Skip missing or invalid image files
  }
}

function strokeBox(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  doc
    .roundedRect(x, y, w, h, 4)
    .lineWidth(0.75)
    .strokeColor("#dddddd")
    .stroke();
}

function drawHeaderContactBlock(
  doc: InstanceType<typeof PDFDocument>,
  bodyFont: string,
  x: number,
  startY: number,
): number {
  doc.font(bodyFont).fontSize(8.5).fillColor("#444444");
  let y = startY + 8;
  doc.text(INVOICE_COMPANY.brandOf, x, y, { width: 268, lineGap: 1 });
  y = doc.y + 7;
  doc.text(`Email: ${INVOICE_COMPANY.email}`, x, y, { width: 268, lineGap: 1 });
  y = doc.y + 5;
  doc.text(`Toll Free: ${INVOICE_COMPANY.phone}`, x, y, { width: 268, lineGap: 1 });
  y = doc.y + 5;
  doc.text(`GSTIN: ${INVOICE_COMPANY.gstin}`, x, y, { width: 268, lineGap: 1 });
  y = doc.y + 5;
  doc.text(`FSSAI: ${INVOICE_COMPANY.fssai}`, x, y, { width: 268, lineGap: 1 });
  return doc.y;
}

function drawTaxInvoiceMeta(
  doc: InstanceType<typeof PDFDocument>,
  boldFont: string,
  bodyFont: string,
  metaTop: number,
  invoiceNumber: string,
  data: InvoiceData,
) {
  doc
    .font(boldFont)
    .fontSize(19)
    .fillColor("#0d0d0d")
    .text("TAX INVOICE", PAGE_MARGIN, metaTop, {
      width: CONTENT_WIDTH,
      align: "right",
    });

  const lines = [
    { text: `Invoice No: ${invoiceNumber}`, font: boldFont, size: 9, color: "#111111" },
    { text: `Order ID: ${data.orderId}`, font: bodyFont, size: 8.5, color: "#333333" },
    {
      text: `Date: ${data.date.toLocaleDateString("en-IN")}`,
      font: bodyFont,
      size: 8.5,
      color: "#333333",
    },
    {
      text: `Payment: ${data.paymentMethod.toUpperCase()} (${data.paymentStatus.toUpperCase()})`,
      font: bodyFont,
      size: 8.5,
      color: "#333333",
    },
  ];

  let metaY = metaTop + 28;
  lines.forEach((line) => {
    doc
      .font(line.font)
      .fontSize(line.size)
      .fillColor(line.color)
      .text(line.text, PAGE_MARGIN, metaY, { width: CONTENT_WIDTH, align: "right" });
    metaY += 13;
  });
  return metaY;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  // Local layout preview only (INVOICE_PDF_LAYOUT_PREVIEW=1) — does not allocate serials.
  const invoiceNumber =
    process.env.INVOICE_PDF_LAYOUT_PREVIEW === "1"
      ? "INV-LAYOUT-PREVIEW"
      : await getOrAllocateInvoiceNumber(data.orderId, data.date);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4" });
      const buffers: Buffer[] = [];
      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const indiaInvoice = isIndiaOrder(data.country);
      const unicodeFonts = indiaInvoice && registerInvoiceFonts(doc);
      const bodyFont = unicodeFonts ? PDF_FONT_REGULAR : "Helvetica";
      const boldFont = unicodeFonts ? PDF_FONT_BOLD : "Helvetica-Bold";
      const fmt = (amount: number) =>
        indiaInvoice ? formatIndianRupee(amount) : `€${amount.toFixed(2)}`;
      const payableTotal = data.indiaGst?.grandTotal ?? data.grandTotal;

      const logoPath = resolveInvoiceLogoPath();
      const stampSignPath = resolveInvoiceAssetPath(INVOICE_STAMP_SIGN_IMAGE_FILENAME);

      let y = PAGE_MARGIN + LOGO_TOP_PAD;

      if (logoPath) {
        drawImageIfExists(doc, logoPath, PAGE_MARGIN, y, LOGO_WIDTH);
      }

      const contactStartY = logoPath ? y + LOGO_BLOCK_HEIGHT + 4 : y;
      const contactEndY = drawHeaderContactBlock(doc, bodyFont, PAGE_MARGIN, contactStartY);

      const metaTop = PAGE_MARGIN + LOGO_TOP_PAD;
      const metaEndY = drawTaxInvoiceMeta(
        doc,
        boldFont,
        bodyFont,
        metaTop,
        invoiceNumber,
        data,
      );

      y = Math.max(contactEndY, metaEndY) + 14;
      doc
        .moveTo(PAGE_MARGIN, y)
        .lineTo(TABLE_RIGHT, y)
        .strokeColor("#cccccc")
        .lineWidth(0.85)
        .stroke();
      y += 14;

      // —— Bill From / Bill To (boxed) ——
      const colW = CONTENT_WIDTH / 2 - 10;
      const billFromX = PAGE_MARGIN;
      const billToX = PAGE_MARGIN + colW + 20;
      const billFromY = y + 4;
      const boxPadX = 10;
      const boxPadY = 10;
      const headingSize = 10;
      const bodySize = 8.5;
      const lineGap = 3;

      const drawBillColumn = (
        title: string,
        x: number,
        startY: number,
        lines: string[],
      ): number => {
        doc
          .font(boldFont)
          .fontSize(headingSize)
          .fillColor("#0d0d0d")
          .text(title, x + boxPadX, startY + boxPadY, { width: colW - boxPadX * 2 });
        let cy = startY + boxPadY + 16;
        doc.font(bodyFont).fontSize(bodySize).fillColor("#333333");
        lines.forEach((line) => {
          doc.text(line, x + boxPadX, cy, { width: colW - boxPadX * 2, lineGap: 1 });
          cy = doc.y + lineGap;
        });
        return cy + boxPadY;
      };

      const fromLines = [INVOICE_COMPANY.legalName, ...INVOICE_COMPANY.addressLines];
      const toLines = [
        data.fullName,
        data.email,
        data.phone,
        data.address,
        `${data.city}, ${data.postalCode}`,
      ];
      if (indiaInvoice) {
        const stateLabel =
          data.state?.trim() || data.indiaGst?.customerState?.trim() || "—";
        toLines.push(`State: ${stateLabel}`);
      }
      toLines.push(`Country: ${data.country}`);

      const fromBottom = drawBillColumn("Bill From", billFromX, billFromY, fromLines);
      const toBottom = drawBillColumn("Bill To", billToX, billFromY, toLines);
      const boxBottom = Math.max(fromBottom, toBottom);
      const boxHeight = boxBottom - billFromY + 4;

      strokeBox(doc, billFromX, billFromY, colW, boxHeight);
      strokeBox(doc, billToX, billFromY, colW, boxHeight);

      y = billFromY + boxHeight + 14;

      // —— Product table ——
      const col = {
        product: PAGE_MARGIN,
        hsn: PAGE_MARGIN + 168,
        qty: PAGE_MARGIN + 238,
        unit: PAGE_MARGIN + 288,
        amount: PAGE_MARGIN + 368,
      };

      const tableHeaderH = 20;
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, tableHeaderH).fill("#f3f3f3");
      doc
        .moveTo(PAGE_MARGIN, y + tableHeaderH)
        .lineTo(TABLE_RIGHT, y + tableHeaderH)
        .strokeColor("#cccccc")
        .lineWidth(0.6)
        .stroke();

      doc.fillColor("#111111").font(boldFont).fontSize(8.5);
      const headerTextY = y + 6;
      doc.text("Product Name", col.product + 6, headerTextY, { width: 156 });
      doc.text("HSN Code", col.hsn + 2, headerTextY, { width: 58 });
      doc.text("Qty", col.qty, headerTextY, { width: 42, align: "right" });
      doc.text("Unit Price", col.unit, headerTextY, { width: 68, align: "right" });
      doc.text("Amount", col.amount, headerTextY, {
        width: TABLE_RIGHT - col.amount - 4,
        align: "right",
      });

      y += tableHeaderH;
      doc.font(bodyFont).fontSize(8.5).fillColor("#333333");

      const rowHeight = 17;
      const rowPadTop = 5;
      data.items.forEach((item, index) => {
        y = advanceY(y, rowHeight + 4);
        if (index % 2 === 1) {
          doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight + 4).fill("#fafafa");
        }
        const textY = y + rowPadTop;
        doc.fillColor("#333333");
        doc.text(item.name, col.product + 6, textY, { width: 156 });
        doc.text(INVOICE_HSN_CODE, col.hsn + 2, textY, { width: 58 });
        doc.text(String(item.quantity), col.qty, textY, { width: 42, align: "right" });
        doc.text(fmt(item.unitPrice), col.unit, textY, { width: 68, align: "right" });
        doc.text(fmt(item.totalPrice), col.amount, textY, {
          width: TABLE_RIGHT - col.amount - 4,
          align: "right",
        });
        y += rowHeight + 4;
        doc
          .moveTo(PAGE_MARGIN, y)
          .lineTo(TABLE_RIGHT, y)
          .strokeColor("#e8e8e8")
          .lineWidth(0.45)
          .stroke();
        y += 1;
      });

      doc
        .moveTo(PAGE_MARGIN, y)
        .lineTo(TABLE_RIGHT, y)
        .strokeColor("#cccccc")
        .lineWidth(0.75)
        .stroke();
      y += 10;

      // —— Totals ——
      const labelX = PAGE_MARGIN + 272;
      const valueX = PAGE_MARGIN + 392;
      const valueW = TABLE_RIGHT - valueX;

      const drawTotalLine = (label: string, value: string, opts?: { grand?: boolean }) => {
        y = advanceY(y, opts?.grand ? 18 : 14);
        const size = opts?.grand ? 10.5 : 8.75;
        const font = opts?.grand ? boldFont : bodyFont;
        const color = opts?.grand ? "#0d0d0d" : "#333333";
        doc.font(font).fontSize(size).fillColor(color);
        doc.text(label, labelX, y, { width: 114, align: "right" });
        doc.text(value, valueX, y, { width: valueW, align: "right" });
        y += opts?.grand ? 14 : 12;
      };

      if (data.indiaGst) {
        if ((data.discount ?? 0) > 0) {
          drawTotalLine("Products", fmt(data.subtotal));
          drawTotalLine("Discount", `-${fmt(data.discount ?? 0)}`);
        }
        drawTotalLine("Taxable Value", fmt(data.indiaGst.taxableValue));
        if (data.indiaGst.scheme === "cgst_sgst") {
          drawTotalLine("CGST (2.5%)", fmt(data.indiaGst.cgst));
          drawTotalLine("SGST (2.5%)", fmt(data.indiaGst.sgst));
        } else {
          drawTotalLine("IGST (5%)", fmt(data.indiaGst.igst));
        }
      } else {
        drawTotalLine("Subtotal", fmt(data.subtotal));
        if (data.tax > 0) drawTotalLine("Tax", fmt(data.tax));
      }

      if (data.delivery > 0) drawTotalLine("Delivery", fmt(data.delivery));
      if (data.shipping > 0) {
        drawTotalLine("Shipping", fmt(data.shipping));
      } else if (indiaInvoice && data.indiaGst) {
        drawTotalLine("Shipping", "FREE");
      }

      y += 4;
      doc
        .moveTo(labelX, y)
        .lineTo(TABLE_RIGHT, y)
        .strokeColor("#222222")
        .lineWidth(1)
        .stroke();
      y += 8;
      drawTotalLine("Grand Total", fmt(payableTotal), { grand: true });

      y += 10;
      doc
        .moveTo(PAGE_MARGIN, y)
        .lineTo(TABLE_RIGHT, y)
        .strokeColor("#eeeeee")
        .lineWidth(0.5)
        .stroke();
      y += 12;

      doc
        .font(boldFont)
        .fontSize(9)
        .fillColor("#111111")
        .text("Amount In Words", PAGE_MARGIN, y);
      const wordsText = indiaInvoice
        ? amountInWordsINR(payableTotal)
        : `Euro ${payableTotal.toFixed(2)} Only`;
      y = boundedText(doc, wordsText, PAGE_MARGIN, y + 12, CONTENT_WIDTH, 28, {
        lineGap: 2,
      });
      y += 14;

      // —— Declaration + Terms (left) | Signature (right) ——
      const declY = y + 4;
      const bottomBlockWidth = CONTENT_WIDTH - 162;
      const stampW = 108;
      const leftBlockBottom = FOOTER_TOP_Y - 12;

      doc.font(boldFont).fontSize(9).fillColor("#111111").text("Declaration", PAGE_MARGIN, declY);
      const declBodyY = declY + 12;
      doc
        .font(bodyFont)
        .fontSize(7.75)
        .fillColor("#444444")
        .text(INVOICE_DECLARATION, PAGE_MARGIN, declBodyY, {
          width: bottomBlockWidth,
          lineGap: 1.5,
        });

      const termsTitleY = doc.y + 8;
      doc.font(boldFont).fontSize(9).text("Terms & Conditions", PAGE_MARGIN, termsTitleY);
      const termsBodyY = termsTitleY + 11;
      const termsBodyH = leftBlockBottom - termsBodyY;
      const termsBody = INVOICE_TERMS.map((term, i) => `${i + 1}. ${term}`).join("\n");
      doc.font(bodyFont).fontSize(7.25).fillColor("#444444");
      boundedText(doc, termsBody, PAGE_MARGIN, termsBodyY, bottomBlockWidth, termsBodyH, {
        lineGap: 2,
      });

      const signBlockX = TABLE_RIGHT - stampW - 8;
      const signBaseY = declY + 14;
      const stampDrawY = signBaseY;

      if (INVOICE_STAMP_IMAGE_PATH && fs.existsSync(INVOICE_STAMP_IMAGE_PATH)) {
        drawImageIfExists(doc, INVOICE_STAMP_IMAGE_PATH, signBlockX, stampDrawY, 58);
      }
      if (INVOICE_SIGNATURE_IMAGE_PATH && fs.existsSync(INVOICE_SIGNATURE_IMAGE_PATH)) {
        drawImageIfExists(
          doc,
          INVOICE_SIGNATURE_IMAGE_PATH,
          signBlockX + 64,
          stampDrawY,
          58,
        );
      }
      if (
        !INVOICE_STAMP_IMAGE_PATH &&
        !INVOICE_SIGNATURE_IMAGE_PATH &&
        stampSignPath
      ) {
        drawImageIfExists(doc, stampSignPath, signBlockX - 4, stampDrawY, stampW);
      }

      const signLabelY = stampDrawY + stampW * 0.48 + 6;
      doc
        .font(boldFont)
        .fontSize(8.75)
        .fillColor("#111111")
        .text(`For ${INVOICE_COMPANY.legalName}`, signBlockX, signLabelY, {
          width: stampW + 16,
          align: "center",
        })
        .font(bodyFont)
        .fontSize(7.75)
        .fillColor("#555555")
        .text("Authorised Signatory", signBlockX, doc.y + 2, {
          width: stampW + 16,
          align: "center",
        });

      const footerRuleY = FOOTER_TOP_Y - 10;
      doc
        .moveTo(PAGE_MARGIN, footerRuleY)
        .lineTo(TABLE_RIGHT, footerRuleY)
        .strokeColor("#dddddd")
        .lineWidth(0.55)
        .stroke();

      doc
        .font(boldFont)
        .fontSize(9)
        .fillColor("#111111")
        .text("Thank you for choosing Poptum.", PAGE_MARGIN, FOOTER_TOP_Y + 4, {
          width: CONTENT_WIDTH,
          align: "center",
          lineBreak: false,
        });
      doc
        .font(bodyFont)
        .fontSize(7.75)
        .fillColor("#555555")
        .text(
          `For support: ${INVOICE_COMPANY.email}  |  Toll Free: ${INVOICE_COMPANY.phone}`,
          PAGE_MARGIN,
          FOOTER_TOP_Y + 16,
          { width: CONTENT_WIDTH, align: "center", lineGap: 1, lineBreak: false },
        );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
