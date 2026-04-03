import bcrypt from "bcrypt";
import { users } from "../shared/schema";
import { generateToken } from "./auth";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import path from "path";
import { db } from "./db";
import { orders, orderItems, ORDER_STATUSES } from "../shared/schema";
import { sql, desc, eq, inArray } from "drizzle-orm";
import nodemailer from "nodemailer";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(1, "Message is required"),
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
  }),
  items: z.array(orderItemSchema).min(1),
});

function calculateTotals(items: z.infer<typeof orderItemSchema>[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const tax = 0;
  const delivery = 0;
  const shipping = 0;
  const grandTotal = subtotal + tax + delivery + shipping;

  return { subtotal, tax, delivery, shipping, grandTotal };
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
    country: string;
  };
  items: z.infer<typeof orderItemSchema>[];
  totals: ReturnType<typeof calculateTotals>;
}) {
  const {
    language,
    orderId,
    customer,
    items,
    totals: { subtotal, tax, delivery, shipping, grandTotal },
  } = args;

  const ownerEmail = process.env.ORDER_OWNER_EMAIL;
  const fromEmail = process.env.ORDER_FROM_EMAIL || ownerEmail;

  if (!ownerEmail || !fromEmail) {
    console.warn(
      "Order email not fully configured. Set ORDER_OWNER_EMAIL and ORDER_FROM_EMAIL.",
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : undefined,
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
        : undefined,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === "de" ? "de-DE" : "en-GB", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const itemsLines = items
    .map(
      (item) =>
        `- ${item.productName} x ${item.quantity} @ ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.unitPrice * item.quantity)}`,
    )
    .join("\n");

  const timestamp = new Date().toLocaleString();
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
Address: ${customer.address}
City: ${customer.city}
Postal Code: ${customer.postalCode}
Country: ${customer.country}

------------------------------
ORDER ITEMS
------------------------------
${itemsLines}

------------------------------
ORDER SUMMARY
------------------------------
Subtotal: ${formatCurrency(subtotal)}
Tax: ${formatCurrency(tax)}
Delivery: ${formatCurrency(delivery)}
Shipping: ${formatCurrency(shipping)}

GRAND TOTAL: ${formatCurrency(grandTotal)}

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

Pricing:
Grand Total: ${formatCurrency(grandTotal)}

Delivery Address:
${customer.fullName}
${customer.address}
${customer.postalCode} ${customer.city}
${customer.country}
`;

  await transporter.sendMail({
    from: fromEmail,
    to: ownerEmail,
    subject: ownerSubject,
    text: ownerBody,
  });

  await transporter.sendMail({
    from: fromEmail,
    to: customer.email,
    subject: customerSubject,
    text: customerBody,
  });
}

async function sendContactEmail(args: {
  name: string;
  email: string;
  message: string;
}) {
  const ownerEmail = process.env.ORDER_OWNER_EMAIL;
  const fromEmail = process.env.ORDER_FROM_EMAIL || ownerEmail;

  if (!ownerEmail || !fromEmail) {
    console.warn(
      "Contact email not configured. Set ORDER_OWNER_EMAIL and ORDER_FROM_EMAIL.",
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : undefined,
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
        : undefined,
  });

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

------------------------------
MESSAGE
------------------------------
${args.message}

==============================
POPTUM WEBSITE CONTACT FORM
==============================
`.trim();

  await transporter.sendMail({
    from: fromEmail,
    to: ownerEmail,
    subject,
    text: body,
    replyTo: args.email,
  });
}

function generateOrderId() {
  return `POPTUM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
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
      const { firstName, lastName, username, email, phone, password, confirmPassword } = req.body;

      if (!firstName || !lastName || !username || !email || !phone || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
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
        .where(eq(users.username, username));

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
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Login failed" });
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
        const fullAddress = [o.address, o.city, o.postalCode, o.country]
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
          product_ordered: productOrdered || "—",
          product: productOrdered || "—",
          quantity: totalQty,
          total_price: totalPriceStr,
          status: o.status ?? "Ordered",
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

  app.post("/api/orders", async (req, res) => {
    try {
      const parsed = createOrderSchema.parse(req.body);
      const totals = calculateTotals(parsed.items);
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
            country: parsed.customer.country,
            subtotal: sql`${totals.subtotal}`,
            tax: sql`${totals.tax}`,
            delivery: sql`${totals.delivery}`,
            shipping: sql`${totals.shipping}`,
            grandTotal: sql`${totals.grandTotal}`,
          })
          .returning();

        const orderId = order.id;

        for (const item of parsed.items) {
          await tx.insert(orderItems).values({
            orderId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: sql`${item.unitPrice}`,
            totalPrice: sql`${item.unitPrice * item.quantity}`,
          });
        }

        return order;
      });

      await sendOrderEmails({
        language: parsed.language,
        orderId: customOrderId,
        customer: parsed.customer,
        items: parsed.items,
        totals,
      });

      res.json({
        success: true,
        orderId: customOrderId,
        totals,
      });
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
          message: "Unable to place order. Please try again.",
        });
      }
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
