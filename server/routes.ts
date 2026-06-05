import bcrypt from "bcrypt";
import { users } from "../shared/schema";
import { generatePasswordResetToken, generateToken, verifyPasswordResetToken, verifyToken } from "./auth";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import path from "path";
import { db, ensureDatabaseSchema } from "./db";
import { orders, orderItems, ORDER_STATUSES, siteRatings } from "../shared/schema";
import { sql, desc, eq, inArray, and } from "drizzle-orm";
import Razorpay from "razorpay";
import { logMailTransportMode, sendAppMail } from "./mail";
import crypto from "crypto";
import { isValidIndianState } from "../shared/indian-states";
import {
  calculateOrderPricing,
  getPacketUnitPrice,
  round2,
  type OrderPricingTotals,
} from "../shared/order-pricing";
import type { IndiaGstBreakdown } from "./gst";
import {
  formatIndiaAdminOrderSummaryBlock,
  formatIndiaCustomerPricingBlock,
  formatIndianRupee,
} from "./gst";

const EUR_TO_INR = 1;

function normalizeCountry(country?: string | null) {
  return country === "India" ? "India" : "Germany";
}

/** India uses Razorpay; Germany uses manual checkout today, Stripe later. */
type CheckoutPaymentFlow = "razorpay" | "manual";

function getCheckoutPaymentFlow(country?: string | null): CheckoutPaymentFlow {
  return normalizeCountry(country) === "India" ? "razorpay" : "manual";
}

function formatCurrencyByCountry(value: number, country?: string | null) {
  const normalized = normalizeCountry(country);
  if (normalized === "India") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value * EUR_TO_INR);
  }
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(1, "Message is required"),
  rating: z.number().optional(),
});

const orderItemSchema = z.object({
  productName: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  image: z.string().optional(),
});

const createOrderSchema = z.object({
  language: z.enum(["en", "de"]),
  customer: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
    address: z.string().min(5),
    city: z.string().min(1),
    postalCode: z.string().min(2),
    country: z.string().min(2),
    state: z.string().optional(),
  }),
  items: z.array(orderItemSchema).min(1),
  paymentMethod: z.enum(["card", "upi"]),
}).superRefine((data, ctx) => {
  if (data.customer.country === "India") {
    if (!data.customer.state?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "State is required for India",
        path: ["customer", "state"],
      });
    } else if (!isValidIndianState(data.customer.state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid Indian state",
        path: ["customer", "state"],
      });
    }
  }
});

function calculateTotals(
  items: z.infer<typeof orderItemSchema>[],
  country?: string | null,
): OrderPricingTotals {
  return calculateOrderPricing(items, country);
}

async function sendOrderEmails(args: {
  language: "en" | "de";
  orderId: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    state?: string | null;
    country: string;
  };
  items: z.infer<typeof orderItemSchema>[];
  totals: ReturnType<typeof calculateTotals>;
  invoicePdf?: Buffer;
  paymentMethod?: string;
  indiaGst?: IndiaGstBreakdown | null;
}) {
  const {
    language,
    orderId,
    customer,
    items,
    totals: { subtotal, discount, tax, delivery, shipping, grandTotal },
    invoicePdf,
    paymentMethod,
    indiaGst,
  } = args;

  const orderTotals: OrderPricingTotals = {
    subtotal,
    discount: discount ?? 0,
    tax,
    delivery,
    shipping,
    grandTotal,
    totalPackets: items.reduce((sum, item) => sum + item.quantity, 0),
  };

  const ownerEmail = process.env.ORDER_OWNER_EMAIL;
  const fromEmail = process.env.ORDER_FROM_EMAIL || ownerEmail;

  if (!ownerEmail || !fromEmail) {
    console.warn(
      "Order email not fully configured. Set ORDER_OWNER_EMAIL and ORDER_FROM_EMAIL.",
    );
    return;
  }

  const formatCurrency = (value: number) =>
    indiaGst ? formatIndianRupee(value) : formatCurrencyByCountry(value, customer.country);

  const itemsLines = items
    .map(
      (item) =>
        `- ${item.productName} x ${item.quantity} @ ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.unitPrice * item.quantity)}`,
    )
    .join("\n");

  const orderSummaryBlock = indiaGst
    ? formatIndiaAdminOrderSummaryBlock({
      orderTotals,
      indiaGst,
      delivery,
      paymentMethod: paymentMethod || "Card",
    })
    : [
      `Subtotal: ${formatCurrency(subtotal)}`,
      delivery > 0 ? `Delivery: ${formatCurrency(delivery)}` : null,
      shipping > 0 ? `Shipping: ${formatCurrency(shipping)}` : null,
      "",
      `GRAND TOTAL: ${formatCurrency(grandTotal)}`,
      `Payment Method: ${paymentMethod || "Card"}`,
    ]
      .filter((line) => line !== null)
      .join("\n");

  const customerPricingBlock = indiaGst
    ? formatIndiaCustomerPricingBlock({
      orderTotals,
      indiaGst,
      delivery,
      paymentMethod: paymentMethod || (language === "de" ? "Karte" : "Card"),
      language,
    })
    : `Pricing:\nGrand Total: ${formatCurrency(grandTotal)}\n${language === "de" ? "Zahlungsart" : "Payment Method"}: ${paymentMethod || (language === "de" ? "Karte" : "Card")}`;

  const timestamp = new Date().toLocaleString();
  const indiaOrder = normalizeCountry(customer.country) === "India";
  const stateLabel =
    customer.state?.trim() || indiaGst?.customerState?.trim() || "";

  const adminShippingLines = indiaOrder
    ? [
      `Address: ${customer.address}`,
      `City: ${customer.city}`,
      `State: ${stateLabel}`,
      `Postal Code: ${customer.postalCode}`,
      `Country: ${customer.country}`,
    ].join("\n")
    : [
      `Address: ${customer.address}`,
      `City: ${customer.city}`,
      `Postal Code: ${customer.postalCode}`,
      `Country: ${customer.country}`,
    ].join("\n");

  const customerDeliveryLines = indiaOrder
    ? [
      customer.fullName,
      customer.address,
      customer.city,
      stateLabel,
      customer.postalCode,
      customer.country,
    ].join("\n")
    : [
      customer.fullName,
      customer.address,
      `${customer.postalCode} ${customer.city}`,
      customer.country,
    ].join("\n");

  const ownerSubject =
    language === "de"
      ? `Neue Bestellung #${orderId}`
      : `New Order #${orderId}`;

  const ownerBody = `
==============================
NEW ORDER RECEIVED - POPTUM
==============================

Order ID: ${orderId}
Order Time: ${timestamp}

------------------------------
CUSTOMER DETAILS
------------------------------
Full Name: ${customer.fullName}
Email: ${customer.email}
Phone: ${customer.phone}

------------------------------
SHIPPING ADDRESS
------------------------------
${adminShippingLines}

------------------------------
ORDER ITEMS
------------------------------
${itemsLines}

------------------------------
ORDER SUMMARY
------------------------------
${orderSummaryBlock}

==============================
POPTUM ORDER SYSTEM
==============================
`;

  const customerSubject =
    language === "de"
      ? `Bestellbestätigung #${orderId}`
      : `Order Confirmation #${orderId}`;

  const customerIntro =
    language === "de"
      ? "Deine Bestellung wurde erfolgreich aufgegeben. Wir melden uns in Kürze bei dir."
      : "Your order has been successfully placed. We’ll contact you shortly.";

  const customerBody = `
${customerIntro}

Order ID: ${orderId}

Items:
${itemsLines}

${customerPricingBlock}

Delivery Address:
${customerDeliveryLines}
`;

  const attachments = invoicePdf
    ? [
      {
        filename: `Invoice_${orderId}.pdf`,
        content: invoicePdf,
      },
    ]
    : [];

  const tAdminEmailStart = performance.now();
  await sendAppMail({
    from: fromEmail,
    to: ownerEmail,
    subject: ownerSubject,
    text: ownerBody,
    attachments,
  });
  console.log(`[ORDER_FULFILLMENT] Admin email sending duration: ${(performance.now() - tAdminEmailStart).toFixed(2)}ms`);

  const tCustomerEmailStart = performance.now();
  await sendAppMail({
    from: fromEmail,
    to: customer.email,
    subject: customerSubject,
    text: customerBody,
    attachments,
  });
  console.log(`[ORDER_FULFILLMENT] Customer email sending duration: ${(performance.now() - tCustomerEmailStart).toFixed(2)}ms`);
}

const GERMANY_MANUAL_ORDER_ADMIN_EMAIL =
  process.env.GERMANY_ORDER_NOTIFY_EMAIL?.trim() || "info.poptum@gmail.com";

/** Germany email display only — dot decimal, trailing € (not de-DE commas). */
function formatGermanyEmailEuro(value: number): string {
  return `${round2(value).toFixed(2)} €`;
}

/** VAT-exclusive breakdown on VAT-inclusive product total (email display only). */
function buildGermanyEmailPricingSummary(
  items: { quantity: number; unitPrice: number }[],
  totals: OrderPricingTotals,
): string {
  const productTotal = round2(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
  const subtotalExVat = round2(productTotal / 1.07);
  const vatAmount = round2(productTotal - subtotalExVat);
  const { discount, shipping, grandTotal } = totals;

  const lines = [
    "PRICING SUMMARY",
    "",
    `Subtotal (Products excl. VAT): ${formatGermanyEmailEuro(subtotalExVat)}`,
    `VAT Included (7%): ${formatGermanyEmailEuro(vatAmount)}`,
  ];
  if (discount > 0) {
    lines.push(`Offer Discount: -${formatGermanyEmailEuro(discount)}`);
  }
  lines.push(
    `Shipping: ${shipping === 0 ? "FREE" : formatGermanyEmailEuro(shipping)}`,
    "",
    `Total Amount Payable: ${formatGermanyEmailEuro(grandTotal)}`,
  );
  return lines.join("\n");
}

function buildGermanyEmailProductLines(
  items: { productName: string; quantity: number; unitPrice: number }[],
): string {
  return items
    .map(
      (item) =>
        `- ${item.productName} | Qty: ${item.quantity} | Line total: ${formatGermanyEmailEuro(item.unitPrice * item.quantity)}`,
    )
    .join("\n");
}

/** Admin-only notice for Germany manual checkout (no PDF, no customer email). */
async function sendGermanyManualOrderAdminNotification(args: {
  orderId: string;
  orderDate: Date;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: z.infer<typeof orderItemSchema>[];
  totals: ReturnType<typeof calculateTotals>;
}) {
  const fromEmail =
    process.env.ORDER_FROM_EMAIL?.trim() ||
    process.env.ORDER_OWNER_EMAIL?.trim();

  if (!fromEmail) {
    console.warn(
      "[GERMANY_ORDER_NOTIFY] ORDER_FROM_EMAIL not configured; skipping admin notification.",
    );
    return;
  }

  const itemsLines = buildGermanyEmailProductLines(args.items);
  const pricingSummary = buildGermanyEmailPricingSummary(args.items, args.totals);
  const orderDateLabel = args.orderDate.toLocaleString("en-GB", {
    timeZone: "Europe/Berlin",
  });

  const subject = `[GERMANY ORDER] New Manual Payment Order - ${args.orderId}`;
  const body = `
==============================
GERMANY MANUAL PAYMENT ORDER
==============================

Order ID: ${args.orderId}
Order Date: ${orderDateLabel}

------------------------------
CUSTOMER
------------------------------
Customer Name: ${args.customer.fullName}
Customer Email: ${args.customer.email}
Customer Phone: ${args.customer.phone}

------------------------------
SHIPPING ADDRESS
------------------------------
${args.customer.address}
${args.customer.postalCode} ${args.customer.city}
Country: ${args.customer.country}

------------------------------
ORDERED PRODUCTS
------------------------------
${itemsLines}

${pricingSummary}

------------------------------
PAYMENT NOTICE
------------------------------
Payment has NOT been received.

This order requires manual customer contact and payment collection.

Payment Status: Pending

==============================
POPTUM — GERMANY MANUAL CHECKOUT
==============================
`;

  await sendAppMail({
    from: fromEmail,
    to: GERMANY_MANUAL_ORDER_ADMIN_EMAIL,
    subject,
    text: body,
  });
  console.log(
    `[GERMANY_ORDER_NOTIFY] Admin notification sent for order ${args.orderId} to ${GERMANY_MANUAL_ORDER_ADMIN_EMAIL}`,
  );
}

/** Customer acknowledgement for Germany manual checkout (no PDF, payment pending). */
async function sendGermanyManualOrderCustomerConfirmation(args: {
  orderId: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: z.infer<typeof orderItemSchema>[];
  totals: ReturnType<typeof calculateTotals>;
}) {
  const fromEmail =
    process.env.ORDER_FROM_EMAIL?.trim() ||
    process.env.ORDER_OWNER_EMAIL?.trim();

  if (!fromEmail) {
    console.warn(
      "[GERMANY_ORDER_NOTIFY] ORDER_FROM_EMAIL not configured; skipping customer confirmation.",
    );
    return;
  }

  const itemsLines = buildGermanyEmailProductLines(args.items);
  const pricingSummary = buildGermanyEmailPricingSummary(args.items, args.totals);

  const subject = `Order Received #${args.orderId}`;
  const body = `
Thank you for ordering from Poptum.

Order ID: ${args.orderId}

Ordered Products:
${itemsLines}

${pricingSummary}

Shipping Address:
${args.customer.fullName}
${args.customer.address}
${args.customer.postalCode} ${args.customer.city}
${args.customer.country}

Payment Status:
Pending

Important Notice:

We currently do not accept direct online EUR payments through the website.

A member of the Poptum team will contact you shortly using your registered email address with payment instructions and order confirmation details.

Please keep your Order ID available for future communication.

Regards,
Team Poptum
`;

  await sendAppMail({
    from: fromEmail,
    to: args.customer.email,
    subject,
    text: body,
  });
  console.log(
    `[GERMANY_ORDER_NOTIFY] Customer confirmation sent for order ${args.orderId} to ${args.customer.email}`,
  );
}

async function sendContactEmail(args: {
  name: string;
  email: string;
  message: string;
  rating?: number;
}) {
  const ownerEmail = process.env.ORDER_OWNER_EMAIL;
  const fromEmail = process.env.ORDER_FROM_EMAIL || ownerEmail;

  if (!ownerEmail || !fromEmail) {
    console.warn(
      "Contact email not configured. Set ORDER_OWNER_EMAIL and ORDER_FROM_EMAIL.",
    );
    return;
  }

  const timestamp = new Date().toLocaleString();
  const subject = `New Contact Message - ${args.name}`;
  const body = `
==============================
NEW CONTACT MESSAGE - POPTUM
==============================

Time: ${timestamp}

------------------------------
SENDER DETAILS
------------------------------
Name: ${args.name}
Email: ${args.email}
${args.rating ? `Rating: ${args.rating} Stars\n` : ''}
------------------------------
MESSAGE
------------------------------
${args.message}

==============================
POPTUM WEBSITE CONTACT FORM
==============================
`.trim();

  sendAppMail({
    from: fromEmail,
    to: ownerEmail,
    subject,
    text: body,
    replyTo: args.email,
  })
    .then((info) => {
      console.log(`Backend Email secretly sent successfully! MessageID: ${info.messageId}`);
    })
    .catch((err) => {
      console.error("EMAIL FAILED:", err);
    });
}

export async function fulfillPaidOrder(
  updatedOrder: any,
  items: any[],
  actualPaymentMethod: string
) {
  if (getCheckoutPaymentFlow(updatedOrder.country) !== "razorpay") {
    return;
  }

  try {
    const tInvoiceStart = performance.now();
    // Generate PDF
    const { generateInvoicePDF } = await import("./pdf");
    const { calculateIndiaGstFromInclusiveTotal } = await import("./gst");
    const grandTotal = Number(updatedOrder.grandTotal);
    const indiaGst = calculateIndiaGstFromInclusiveTotal(grandTotal, {
      country: updatedOrder.country,
      state: updatedOrder.state,
      postalCode: updatedOrder.postalCode,
    });
    const invoicePdf = await generateInvoicePDF({
      orderId: updatedOrder.orderId,
      fullName: updatedOrder.fullName,
      email: updatedOrder.email,
      phone: updatedOrder.phone,
      address: updatedOrder.address,
      city: updatedOrder.city,
      postalCode: updatedOrder.postalCode,
      state: updatedOrder.state ?? indiaGst?.customerState ?? null,
      country: updatedOrder.country,
      items: items.map(i => ({
        name: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice)
      })),
      subtotal: Number(updatedOrder.subtotal),
      tax: Number(updatedOrder.tax),
      delivery: Number(updatedOrder.delivery),
      shipping: Number(updatedOrder.shipping),
      grandTotal,
      discount: calculateOrderPricing(
        items.map((i) => ({ quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
        updatedOrder.country,
      ).discount,
      paymentMethod: actualPaymentMethod,
      paymentStatus: "paid",
      date: updatedOrder.createdAt || new Date(),
      indiaGst: indiaGst ?? undefined,
    });
    const tInvoiceDuration = performance.now() - tInvoiceStart;
    console.log(`[ORDER_FULFILLMENT] Invoice generation duration: ${tInvoiceDuration.toFixed(2)}ms`);

    const tEmailsStart = performance.now();
    // Send Emails
    await sendOrderEmails({
      language: updatedOrder.language as "en" | "de",
      orderId: updatedOrder.orderId,
      customer: {
        fullName: updatedOrder.fullName,
        email: updatedOrder.email,
        phone: updatedOrder.phone,
        address: updatedOrder.address,
        city: updatedOrder.city,
        postalCode: updatedOrder.postalCode,
        state: updatedOrder.state,
        country: updatedOrder.country,
      },
      items: items.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
      })),
      totals: calculateOrderPricing(
        items.map((i) => ({
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
        })),
        updatedOrder.country,
      ),
      invoicePdf,
      paymentMethod: actualPaymentMethod,
      indiaGst,
    });
    const tEmailsDuration = performance.now() - tEmailsStart;
    console.log(`[ORDER_FULFILLMENT] Email sending duration: ${tEmailsDuration.toFixed(2)}ms`);
  } catch (backgroundError) {
    console.error("[ORDER_FULFILLMENT] Safe background fulfillment failed:", backgroundError);
  }
}

function generateOrderId() {
  return `POPTUM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export async function cleanupExpiredOrders() {
  const now = new Date();
  try {
    const expiredRows = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "pending"),
          sql`${orders.paymentExpiresAt} IS NOT NULL`,
          sql`${orders.paymentExpiresAt} <= ${now}`
        )
      );

    if (expiredRows.length > 0) {
      const expiredIds = expiredRows.map((o) => o.id);
      await db
        .update(orders)
        .set({
          status: "Cancelled",
          paymentStatus: "failed",
        })
        .where(inArray(orders.id, expiredIds));

      expiredRows.forEach((o) => {
        console.log(`[ORDER_EXPIRED] Order ${o.orderId} (ID: ${o.id}) has expired. Status set to Cancelled, Payment Status set to Failed.`);
      });
    } else {
      console.log("[ORDER_EXPIRED] No expired pending orders found during cleanup.");
    }
  } catch (error) {
    console.error("[ORDER_EXPIRED] Error during expired orders cleanup:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await ensureDatabaseSchema();
  logMailTransportMode();

  cleanupExpiredOrders().catch((err) => {
    console.error("Failed to run expired orders cleanup on startup", err);
  });

  let razorpay: any = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS site_ratings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        rating INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error("Failed to initialize site_ratings table", e);
  }

  app.get("/api/ratings", async (req, res) => {
    try {
      const allRatings = await db.select().from(siteRatings);
      if (allRatings.length === 0) {
        return res.json({ count: 0, average: 0, ratings: [] });
      }
      const sum = allRatings.reduce((acc, curr) => acc + curr.rating, 0);
      const average = sum / allRatings.length;
      res.json({ count: allRatings.length, average: Number(average.toFixed(1)) });
    } catch (err) {
      console.error("Ratings fetch error (DB unavailable):", err);
      // Fallback response for when DB is paused/offline (e.g. Supabase paused)
      res.json({ count: 0, average: 0 });
    }
  });

  app.post("/api/ratings", async (req, res) => {
    try {
      const parsed = z.object({ rating: z.number().min(1).max(5) }).parse(req.body);
      await db.insert(siteRatings).values({ rating: parsed.rating });
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid rating payload" });
      }
      console.error("Ratings post error (DB unavailable):", err);
      // Fail gracefully if DB is paused so local testing works without crashing
      res.json({ success: false, error: "Database unavailable" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const data = contactSchema.parse(req.body);

      console.log("Contact form submission received:", {
        name: data.name,
        email: data.email,
        message: data.message.substring(0, 50) + "...",
        timestamp: new Date().toISOString(),
      });

      // Fire and forget email sending so user doesn't wait for SMTP
      sendContactEmail({
        name: data.name,
        email: data.email,
        message: data.message,
        rating: data.rating,
      }).catch(err => {
        console.error("Failed to send background contact email:", err);
      });

      res.json({
        success: true,
        message: "Thank you for your message! We will get back to you soon.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "An error occurred. Please try again.",
        });
      }
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { firstName, lastName, username, email, phone, country, password, confirmPassword } = req.body;

      if (!firstName || !lastName || !username || !email || !phone || !country || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      if (country !== "India" && country !== "Germany") {
        return res.status(400).json({ message: "Country must be India or Germany" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        return res.status(400).json({ message: "Password must be at least 8 characters and include an uppercase letter, a number, and a special character." });
      }

      // Check existing
      const [existingUser] = await db
        .select()
        .from(users)
        .where(sql`username = ${username} OR email = ${email}`);

      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [user] = await db
        .insert(users)
        .values({
          firstName,
          lastName,
          username,
          email,
          phone,
          country,
          password: hashedPassword,
          role: "user",
        })
        .returning();

      res.json({ success: true, userId: user.id });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(sql`username = ${username} OR email = ${username}`);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({
        id: user.id,
        role: user.role,
      });

      res.json({
        success: true,
        token,
        role: user.role,
        username: user.username,
        country: user.country ?? "Germany",
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token) as { id: string; role: string };

      const [user] = await db.select().from(users).where(eq(users.id, payload.id));
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          country: user.country,
        }
      });
    } catch (error) {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  });

  app.post("/api/user/update-country", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token) as { id: string; role: string };

      const { country } = req.body;
      if (country !== "India" && country !== "Germany") {
        return res.status(400).json({ success: false, message: "Country must be India or Germany" });
      }

      await db
        .update(users)
        .set({ country })
        .where(eq(users.id, payload.id));

      res.json({ success: true, country });
    } catch (error) {
      console.error("Update country error:", error);
      res.status(500).json({ success: false, message: "Failed to update country" });
    }
  });

  const sendPasswordResetEmail = (args: {
    email: string;
    resetLink: string;
    language: "en" | "de";
  }) => {
    const ownerEmail = process.env.ORDER_OWNER_EMAIL;
    const fromEmail = process.env.ORDER_FROM_EMAIL || ownerEmail;

    if (!ownerEmail || !fromEmail) {
      console.warn("Password reset email not fully configured (ORDER_OWNER_EMAIL).");
      return;
    }

    const subject = args.language === "de" ? "Passwort zurücksetzen" : "Reset your password";
    const body =
      args.language === "de"
        ? `Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.\n\nBitte klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:\n${args.resetLink}\n\nWenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.`
        : `We received a request to reset your password.\n\nPlease click the link below to reset your password:\n${args.resetLink}\n\nIf you didn't request this, you can ignore this email.`;

    sendAppMail({
      from: fromEmail,
      to: args.email,
      subject,
      text: body,
    }).catch((err) => {
      console.error("Password reset email send failed:", err);
    });
  };

  const passwordResetRequestSchema = z.object({
    email: z.string().email(),
    language: z.enum(["en", "de"]).optional(),
  });

  app.post("/api/auth/request-password-reset", async (req, res) => {
    try {
      const parsed = passwordResetRequestSchema.parse(req.body);
      const language = parsed.language ?? "en";

      const [user] = await db.select().from(users).where(eq(users.email, parsed.email));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with that email address.",
        });
      }

      const resetToken = generatePasswordResetToken(parsed.email);
      const resetBaseUrl = req.headers.origin || process.env.PUBLIC_BASE_URL || (process.env.NODE_ENV === "production" ? "https://poptum.in" : "http://localhost:5173");
      const resetLink = `${resetBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(parsed.email)}`;

      sendPasswordResetEmail({
        email: parsed.email,
        resetLink,
        language,
      });

      res.json({
        success: true,
        message: "A password reset email has been sent to your email address.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid request payload" });
      }
      console.error("Password reset request error:", error);
      res.status(500).json({ success: false, message: "Unable to process request" });
    }
  });

  const passwordResetSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
    language: z.enum(["en", "de"]).optional(),
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const parsed = passwordResetSchema.parse(req.body);

      const payload = verifyPasswordResetToken(parsed.token) as unknown as { email?: string; kind?: string };
      if (!payload?.email || payload.kind !== "password_reset") {
        return res.status(400).json({ success: false, message: "Invalid reset token" });
      }

      const hashedPassword = await bcrypt.hash(parsed.newPassword, 10);

      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, payload.email));

      res.json({ success: true });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      const orderRows = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(100);

      if (orderRows.length === 0) {
        return res.json([]);
      }

      const orderIds = orderRows.map((o) => o.id);
      const itemsRows = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

      const itemsByOrderId = new Map<string, typeof itemsRows>();
      for (const item of itemsRows) {
        const list = itemsByOrderId.get(item.orderId) ?? [];
        list.push(item);
        itemsByOrderId.set(item.orderId, list);
      }

      const result = orderRows.map((o) => {
        const items = itemsByOrderId.get(o.id) ?? [];
        const productOrdered = items.map((i) => i.productName).join(", ");
        const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
        const fullAddress = [o.address, o.city, o.state, o.postalCode, o.country]
          .filter((v) => v != null && v !== "")
          .join(", ");
        const grandTotal = o.grandTotal;
        const totalPriceStr =
          grandTotal != null && grandTotal !== ""
            ? String(grandTotal)
            : "0";
        return {
          id: o.id,
          order_id: o.orderId,
          full_name: o.fullName ?? "",
          email: o.email ?? "",
          phone: o.phone ?? "",
          address: fullAddress || "—",
          state: o.state ?? null,
          country: o.country,
          product_ordered: productOrdered || "—",
          product: productOrdered || "—",
          quantity: totalQty,
          total_price: totalPriceStr,
          status: o.status ?? "Ordered",
          payment_status: o.paymentStatus ?? "pending",
          created_at: o.createdAt,
          issue_note: o.issueNote ?? null,
          items: items.map((i) => ({
            id: i.id,
            product_name: i.productName,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            total_price: i.totalPrice,
          })),
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Admin orders fetch error", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  const orderStatusSchema = z.enum(ORDER_STATUSES as unknown as [string, ...string[]]);

  // Status-only update: only the row matching id is updated (single row)
  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Order id is required" });
      }
      const body = req.body;
      const status = orderStatusSchema.safeParse(body?.status);
      if (!status.success) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const [existing] = await db.select().from(orders).where(eq(orders.id, id));
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }
      await db.update(orders).set({ status: status.data }).where(eq(orders.id, id));
      const [updated] = await db.select().from(orders).where(eq(orders.id, id));
      res.json(updated);
    } catch (error) {
      console.error("Admin order status update error", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.patch("/api/admin/orders/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Order id is required" });
      }
      const body = req.body;

      const [existing] = await db.select().from(orders).where(eq(orders.id, id));
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updateOrder: Record<string, unknown> = {};
      if (body.status !== undefined) {
        const status = orderStatusSchema.safeParse(body.status);
        if (!status.success) {
          return res.status(400).json({ message: "Invalid status" });
        }
        updateOrder.status = status.data;
      }
      if (body.address !== undefined) updateOrder.address = body.address;
      if (body.city !== undefined) updateOrder.city = body.city;
      if (body.postalCode !== undefined) updateOrder.postalCode = body.postalCode;
      if (body.country !== undefined) updateOrder.country = body.country;
      if (body.state !== undefined) updateOrder.state = body.state;

      if (body.product !== undefined || body.quantity !== undefined || body.unitPrice !== undefined) {
        const existingItems = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
        const firstItem = existingItems[0];
        const productName = (body.product !== undefined ? body.product : firstItem?.productName) ?? "Product";
        const quantity = typeof body.quantity === "number" ? body.quantity : (firstItem?.quantity ?? 1);
        const unitPrice = typeof body.unitPrice === "number" ? body.unitPrice : Number(firstItem?.unitPrice ?? 0);
        const totalPrice = unitPrice * quantity;

        await db.delete(orderItems).where(eq(orderItems.orderId, id));
        await db.insert(orderItems).values({
          orderId: id,
          productName,
          quantity,
          unitPrice: sql`${unitPrice}`,
          totalPrice: sql`${totalPrice}`,
        });

        const subtotal = totalPrice;
        const tax = 0;
        const delivery = 0;
        const shipping = 0;
        const grandTotal = subtotal + tax + delivery + shipping;
        updateOrder.subtotal = subtotal;
        updateOrder.tax = tax;
        updateOrder.delivery = delivery;
        updateOrder.shipping = shipping;
        updateOrder.grandTotal = grandTotal;
      }

      if (Object.keys(updateOrder).length > 0) {
        await db.update(orders).set(updateOrder as Record<string, string | number>).where(eq(orders.id, id));
      }

      const [updated] = await db.select().from(orders).where(eq(orders.id, id));
      res.json(updated);
    } catch (error) {
      console.error("Admin order update error", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete("/api/admin/orders/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Order id is required" });
      }
      const [existing] = await db.select().from(orders).where(eq(orders.id, id));
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }
      await db.delete(orders).where(eq(orders.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Admin order delete error", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Admin dashboard can use these endpoints; update only the order matching id
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ message: "Order id is required" });
      const status = orderStatusSchema.safeParse(req.body?.status);
      if (!status.success) return res.status(400).json({ message: "Invalid status" });
      const [existing] = await db.select().from(orders).where(eq(orders.id, id));
      if (!existing) return res.status(404).json({ message: "Order not found" });
      await db.update(orders).set({ status: status.data }).where(eq(orders.id, id));
      const [updated] = await db.select().from(orders).where(eq(orders.id, id));
      res.json(updated);
    } catch (error) {
      console.error("Order status update error", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ message: "Order id is required" });
      const [existing] = await db.select().from(orders).where(eq(orders.id, id));
      if (!existing) return res.status(404).json({ message: "Order not found" });
      await db.delete(orders).where(eq(orders.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Order delete error", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ message: "Order id is required" });
      const body = req.body;
      const [existing] = await db.select().from(orders).where(eq(orders.id, id));
      if (!existing) return res.status(404).json({ message: "Order not found" });
      const updateOrder: Record<string, unknown> = {};
      if (body.status !== undefined) {
        const status = orderStatusSchema.safeParse(body.status);
        if (!status.success) return res.status(400).json({ message: "Invalid status" });
        updateOrder.status = status.data;
      }
      if (body.address !== undefined) updateOrder.address = body.address;
      if (body.city !== undefined) updateOrder.city = body.city;
      if (body.postalCode !== undefined) updateOrder.postalCode = body.postalCode;
      if (body.state !== undefined) updateOrder.state = body.state;
      if (body.country !== undefined) updateOrder.country = body.country;
      if (body.product !== undefined || body.quantity !== undefined || body.unitPrice !== undefined) {
        const existingItems = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
        const firstItem = existingItems[0];
        const productName = (body.product !== undefined ? body.product : firstItem?.productName) ?? "Product";
        const quantity = typeof body.quantity === "number" ? body.quantity : (firstItem?.quantity ?? 1);
        const unitPrice = typeof body.unitPrice === "number" ? body.unitPrice : Number(firstItem?.unitPrice ?? 0);
        const totalPrice = unitPrice * quantity;
        await db.delete(orderItems).where(eq(orderItems.orderId, id));
        await db.insert(orderItems).values({
          orderId: id,
          productName,
          quantity,
          unitPrice: sql`${unitPrice}`,
          totalPrice: sql`${totalPrice}`,
        });
        updateOrder.subtotal = totalPrice;
        updateOrder.tax = 0;
        updateOrder.delivery = 0;
        updateOrder.shipping = 0;
        updateOrder.grandTotal = totalPrice;
      }
      if (Object.keys(updateOrder).length > 0) {
        await db.update(orders).set(updateOrder as Record<string, string | number>).where(eq(orders.id, id));
      }
      const [updated] = await db.select().from(orders).where(eq(orders.id, id));
      res.json(updated);
    } catch (error) {
      console.error("Order update error", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  const adminCreateOrderSchema = z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    product: z.string().min(1),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    status: orderStatusSchema.optional().default("Ordered"),
  });

  app.post("/api/admin/orders", async (req, res) => {
    try {
      const parsed = adminCreateOrderSchema.parse(req.body);
      const customOrderId = generateOrderId();
      const subtotal = parsed.price * parsed.quantity;
      const tax = 0;
      const delivery = 0;
      const shipping = 0;
      const grandTotal = subtotal + tax + delivery + shipping;

      const [order] = await db
        .insert(orders)
        .values({
          orderId: customOrderId,
          language: "en",
          fullName: parsed.fullName,
          email: parsed.email,
          phone: parsed.phone,
          address: parsed.address,
          city: "-",
          postalCode: "-",
          country: "-",
          subtotal: sql`${subtotal}`,
          tax: sql`${tax}`,
          delivery: sql`${delivery}`,
          shipping: sql`${shipping}`,
          grandTotal: sql`${grandTotal}`,
          status: parsed.status,
        })
        .returning();

      await db.insert(orderItems).values({
        orderId: order.id,
        productName: parsed.product,
        quantity: parsed.quantity,
        unitPrice: sql`${parsed.price}`,
        totalPrice: sql`${parsed.price * parsed.quantity}`,
      });

      res.status(201).json({ success: true, orderId: customOrderId, id: order.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      console.error("Admin create order error", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/pending", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token) as { id: string; role: string };

      const [user] = await db.select().from(users).where(eq(users.id, payload.id));
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (!user.email) {
        return res.status(400).json({ success: false, message: "User email not configured" });
      }

      const pendingOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.email, user.email),
            eq(orders.paymentStatus, "pending"),
            eq(orders.status, "Ordered"),
            sql`${orders.paymentExpiresAt} > NOW()`
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(1);

      if (pendingOrders.length === 0) {
        return res.json({ success: true, order: null });
      }

      const pendingOrderRow = pendingOrders[0];
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, pendingOrderRow.id));

      res.json({
        success: true,
        order: {
          id: pendingOrderRow.id,
          orderId: pendingOrderRow.orderId,
          totals: {
            subtotal: Number(pendingOrderRow.subtotal),
            tax: Number(pendingOrderRow.tax),
            delivery: Number(pendingOrderRow.delivery),
            shipping: Number(pendingOrderRow.shipping),
            grandTotal: Number(pendingOrderRow.grandTotal),
          },
          customerDetails: {
            fullName: pendingOrderRow.fullName,
            email: pendingOrderRow.email,
            phone: pendingOrderRow.phone,
            address: pendingOrderRow.address,
            city: pendingOrderRow.city,
            postalCode: pendingOrderRow.postalCode,
            state: pendingOrderRow.state,
            country: pendingOrderRow.country,
          },
          cartSnapshot: items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
          paymentExpiresAt: pendingOrderRow.paymentExpiresAt,
        },
      });
    } catch (error) {
      console.error("Failed to fetch pending order", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const parsed = createOrderSchema.parse(req.body);
      const totals = calculateTotals(parsed.items, parsed.customer.country);
      const paymentFlow = getCheckoutPaymentFlow(parsed.customer.country);
      const unitPriceForCountry = getPacketUnitPrice(parsed.customer.country);
      const customOrderId = generateOrderId();
      const insertedOrder = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            orderId: customOrderId,
            language: parsed.language,
            fullName: parsed.customer.fullName,
            email: parsed.customer.email,
            phone: parsed.customer.phone,
            address: parsed.customer.address,
            city: parsed.customer.city,
            postalCode: parsed.customer.postalCode,
            state:
              parsed.customer.country === "India"
                ? parsed.customer.state?.trim() ?? null
                : null,
            country: parsed.customer.country,
            subtotal: sql`${totals.subtotal}`,
            tax: sql`${totals.tax}`,
            delivery: sql`${totals.delivery}`,
            shipping: sql`${totals.shipping}`,
            grandTotal: sql`${totals.grandTotal}`,
            paymentMethod: parsed.paymentMethod,
            status: "Ordered",
            paymentStatus: "pending",
            paymentExpiresAt:
              paymentFlow === "razorpay"
                ? new Date(Date.now() + 15 * 60 * 1000)
                : null,
          })
          .returning();

        const orderId = order.id;

        for (const item of parsed.items) {
          await tx.insert(orderItems).values({
            orderId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: sql`${unitPriceForCountry}`,
            totalPrice: sql`${unitPriceForCountry * item.quantity}`,
          });
        }

        return order;
      });

      res.status(201).json({
        success: true,
        orderId: customOrderId,
        id: insertedOrder.id,
        totals,
        paymentExpiresAt: insertedOrder.paymentExpiresAt,
      });

      if (paymentFlow === "manual") {
        const germanyNotifyArgs = {
          orderId: customOrderId,
          orderDate: insertedOrder.createdAt ?? new Date(),
          customer: parsed.customer,
          items: parsed.items,
          totals,
        };
        sendGermanyManualOrderAdminNotification(germanyNotifyArgs).catch((err) => {
          console.error(
            "[GERMANY_ORDER_NOTIFY] Failed to send admin notification:",
            err,
          );
        });
        sendGermanyManualOrderCustomerConfirmation(germanyNotifyArgs).catch((err) => {
          console.error(
            "[GERMANY_ORDER_NOTIFY] Failed to send customer confirmation:",
            err,
          );
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
        });
      } else {
        console.error("Order error", error);
        res.status(500).json({
          success: false,
          message: "Unable to place order. Please try again. Error: " + (error instanceof Error ? error.message : String(error)),
        });
      }
    }
  });

  app.post("/api/create-razorpay-order", async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(500).json({ success: false, message: "Razorpay not configured on server" });
      }

      const { amount, currency, receipt } = req.body;
      if (!amount || amount < 100) {
        return res.status(400).json({ success: false, message: "Invalid amount. Must be >= 100 paise" });
      }

      const options = {
        amount, // in paise
        currency: currency || "INR",
        receipt,
      };

      const order = await razorpay.orders.create(options);
      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error) {
      console.error("Razorpay create order error", error);
      res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
    }
  });

  app.post("/api/orders/:id/verify", async (req, res) => {
    const tEndpointStart = performance.now();
    let tSigDuration = 0;
    let tRzpFetchDuration = 0;
    let tDbDuration = 0;

    try {
      const id = req.params.id;
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};

      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (getCheckoutPaymentFlow(order.country) === "manual") {
        return res.status(400).json({
          success: false,
          message: "Online payment verification is not available for manual checkout orders.",
        });
      }

      // Enforce Razorpay payment details and signature check for India users
      if (order.country === "India") {
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
          return res.status(400).json({
            success: false,
            message: "Razorpay payment details are required for payments in India."
          });
        }
      }

      // If razorpay details are provided, verify the signature
      const tSigStart = performance.now();
      if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
        if (!process.env.RAZORPAY_KEY_SECRET) {
          return res.status(500).json({ success: false, message: "Server not configured for Razorpay" });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest("hex");

        if (expectedSignature !== razorpay_signature) {
          console.log(`[PAYMENT_VERIFY] Signature verification failed`);
          return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
      }
      tSigDuration = performance.now() - tSigStart;

      // Fetch actual payment details from Razorpay to get the correct payment method
      let actualPaymentMethod = order.paymentMethod || "Card";
      if (razorpay && razorpay_payment_id) {
        const tRzpFetchStart = performance.now();
        try {
          const payment = await razorpay.payments.fetch(razorpay_payment_id);
          if (payment && payment.method) {
            const methodLower = String(payment.method).toLowerCase();
            if (methodLower === "upi") {
              actualPaymentMethod = "UPI";
            } else if (methodLower === "card") {
              actualPaymentMethod = "Card";
            } else if (methodLower === "netbanking") {
              actualPaymentMethod = "Netbanking";
            } else if (methodLower === "wallet") {
              actualPaymentMethod = "Wallet";
            } else {
              actualPaymentMethod = payment.method.charAt(0).toUpperCase() + payment.method.slice(1);
            }
          }
        } catch (err) {
          console.error("[PAYMENT_VERIFY] Failed to fetch payment details from Razorpay:", err);
        }
        tRzpFetchDuration = performance.now() - tRzpFetchStart;
      }

      // Transaction starts
      const tDbStart = performance.now();
      let updatedOrder: any = null;
      let shouldFulfill = false;

      await db.transaction(async (tx) => {
        const [lockedOrder] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, id))
          .for("update");

        if (!lockedOrder) {
          return;
        }

        // Idempotency: if already paid (or transactionId matches razorpay_payment_id), return early
        if (lockedOrder.paymentStatus === "paid" || (razorpay_payment_id && lockedOrder.transactionId === razorpay_payment_id)) {
          return;
        }

        const [uOrder] = await tx
          .update(orders)
          .set({
            paymentStatus: "paid",
            transactionId: razorpay_payment_id || lockedOrder.transactionId,
            razorpayOrderId: razorpay_order_id || lockedOrder.razorpayOrderId,
            paymentMethod: actualPaymentMethod
          })
          .where(eq(orders.id, id))
          .returning();

        updatedOrder = uOrder;
        shouldFulfill = true;
      });
      tDbDuration = performance.now() - tDbStart;

      // Retrieve items and trigger fulfillment outside the db transaction to keep the lock held time minimal
      if (shouldFulfill && updatedOrder) {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
        res.json({ success: true });

        // Run fulfillment asynchronously in the background
        setImmediate(() => {
          fulfillPaidOrder(updatedOrder, items, actualPaymentMethod).catch((err) => {
            console.error("[PAYMENT_VERIFY] Background fulfillment failed:", err);
          });
        });
      } else {
        // Already paid
        console.log(`[PAYMENT_VERIFY] Idempotent call completed in ${(performance.now() - tEndpointStart).toFixed(2)}ms`);
        res.json({ success: true, message: "Already paid" });
      }

      const tEndpointDuration = performance.now() - tEndpointStart;
      console.log(`[PAYMENT_VERIFY] Signature verification duration: ${tSigDuration.toFixed(2)}ms`);
      console.log(`[PAYMENT_VERIFY] Razorpay payment fetch duration: ${tRzpFetchDuration.toFixed(2)}ms`);
      console.log(`[PAYMENT_VERIFY] Database update duration: ${tDbDuration.toFixed(2)}ms`);
      console.log(`[PAYMENT_VERIFY] Verification endpoint total duration: ${tEndpointDuration.toFixed(2)}ms`);

    } catch (error) {
      console.error("Payment verification error", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Failed to verify payment" });
      }
    }
  });

  app.post("/api/webhooks/razorpay", async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("[WEBHOOK] Razorpay webhook secret is not configured on the server.");
        return res.status(500).json({ success: false, message: "Webhook secret not configured" });
      }

      const signature = req.headers["x-razorpay-signature"] as string;
      if (!signature) {
        console.warn("[WEBHOOK] Missing Razorpay signature header.");
        return res.status(400).json({ success: false, message: "Missing signature" });
      }

      // Verify Webhook Signature
      const rawBodyString = (req as any).rawBody ? (req as any).rawBody.toString() : "";
      const isValid = Razorpay.validateWebhookSignature(
        rawBodyString,
        signature,
        webhookSecret
      );

      if (!isValid) {
        console.warn("[WEBHOOK] Invalid Razorpay webhook signature.");
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      const event = req.body;
      console.log(`[WEBHOOK] Received Razorpay event: ${event.event}`);

      // We only handle order.paid
      if (event.event === "order.paid") {
        const razorpayOrder = event.payload.order.entity;
        const razorpayOrderId = razorpayOrder.id;

        // Find the order in the database matching razorpayOrderId
        const [matchingOrder] = await db
          .select()
          .from(orders)
          .where(eq(orders.razorpayOrderId, razorpayOrderId));

        if (!matchingOrder) {
          console.warn(`[WEBHOOK] Order with Razorpay Order ID ${razorpayOrderId} not found.`);
          return res.json({ status: "ignored", reason: "Order not found" });
        }

        const orderId = matchingOrder.id;
        const paymentEntity = event.payload.payment?.entity;
        const transactionId = paymentEntity?.id || matchingOrder.transactionId;

        let actualPaymentMethod = matchingOrder.paymentMethod || "Card";
        if (paymentEntity && paymentEntity.method) {
          const methodLower = String(paymentEntity.method).toLowerCase();
          if (methodLower === "upi") {
            actualPaymentMethod = "UPI";
          } else if (methodLower === "card") {
            actualPaymentMethod = "Card";
          } else if (methodLower === "netbanking") {
            actualPaymentMethod = "Netbanking";
          } else if (methodLower === "wallet") {
            actualPaymentMethod = "Wallet";
          } else {
            actualPaymentMethod = paymentEntity.method.charAt(0).toUpperCase() + paymentEntity.method.slice(1);
          }
        }

        let updatedOrder: any = null;
        let shouldFulfill = false;

        // Transaction starts
        await db.transaction(async (tx) => {
          const [lockedOrder] = await tx
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .for("update");

          if (!lockedOrder) {
            return;
          }

          // Idempotency: if already paid (or transactionId matches incoming id), return early
          if (lockedOrder.paymentStatus === "paid" || (transactionId && lockedOrder.transactionId === transactionId)) {
            return;
          }

          const [uOrder] = await tx
            .update(orders)
            .set({
              paymentStatus: "paid",
              transactionId: transactionId || lockedOrder.transactionId,
              paymentMethod: actualPaymentMethod
            })
            .where(eq(orders.id, orderId))
            .returning();

          updatedOrder = uOrder;
          shouldFulfill = true;
        });

        // Trigger fulfillment outside the transaction
        if (shouldFulfill && updatedOrder) {
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
          console.log(`[WEBHOOK] Successfully marked order ${updatedOrder.orderId} as paid via webhook.`);

          setImmediate(() => {
            fulfillPaidOrder(updatedOrder, items, actualPaymentMethod).catch((err) => {
              console.error("[WEBHOOK] Background fulfillment failed:", err);
            });
          });
        } else {
          console.log(`[WEBHOOK] Order ${matchingOrder.orderId} was already paid, ignoring duplicate webhook.`);
        }
      }

      res.json({ status: "ok" });
    } catch (error) {
      console.error("[WEBHOOK] Error processing webhook:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

  app.post("/api/orders/:id/cancel", async (req, res) => {
    try {
      const id = req.params.id;
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      if (!order) return res.status(404).json({ message: "Order not found" });

      await db.update(orders).set({ paymentStatus: "failed", status: "Cancelled" }).where(eq(orders.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Payment cancellation error", error);
      res.status(500).json({ success: false, message: "Failed to cancel order" });
    }
  });

  app.get("/api/catalogue", (req, res) => {
    const pdfPath = path.join(
      process.cwd(),
      "assets",
      "catalogue.pdf",
    );
    res.download(pdfPath, "catalogue.pdf", (err) => {
      if (err) {
        console.error("Error downloading catalogue:", err);
        res.status(404).json({ error: "Catalogue not found" });
      }
    });
  });

  return httpServer;
}
