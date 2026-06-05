import { pool } from "./db";

/** India FY label for invoice series, e.g. "26-27" for FY 2026-27 (Apr–Mar). */
export function getIndianFinancialYearLabel(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 3) {
    const start = year % 100;
    const end = (year + 1) % 100;
    return `${String(start).padStart(2, "0")}-${String(end).padStart(2, "0")}`;
  }
  const start = (year - 1) % 100;
  const end = year % 100;
  return `${String(start).padStart(2, "0")}-${String(end).padStart(2, "0")}`;
}

let schemaReady: Promise<void> | null = null;

async function ensureInvoiceNumberSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS invoice_serial (
          financial_year TEXT PRIMARY KEY,
          last_number INTEGER NOT NULL DEFAULT 0
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_invoice_numbers (
          order_id TEXT PRIMARY KEY,
          invoice_number TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    })();
  }
  await schemaReady;
}

/**
 * Sequential invoice number per financial year: INV-26-27-00001
 * Reuses the same number if PDF is regenerated for the same order_id.
 */
export async function getOrAllocateInvoiceNumber(
  orderId: string,
  invoiceDate: Date,
): Promise<string> {
  await ensureInvoiceNumberSchema();

  const existing = await pool.query<{ invoice_number: string }>(
    `SELECT invoice_number FROM order_invoice_numbers WHERE order_id = $1`,
    [orderId],
  );
  if (existing.rows[0]?.invoice_number) {
    return existing.rows[0].invoice_number;
  }

  const fy = getIndianFinancialYearLabel(invoiceDate);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO invoice_serial (financial_year, last_number)
       VALUES ($1, 0)
       ON CONFLICT (financial_year) DO NOTHING`,
      [fy],
    );
    const next = await client.query<{ last_number: number }>(
      `UPDATE invoice_serial
       SET last_number = last_number + 1
       WHERE financial_year = $1
       RETURNING last_number`,
      [fy],
    );
    const seq = next.rows[0]?.last_number ?? 1;
    const invoiceNumber = `INV-${fy}-${String(seq).padStart(5, "0")}`;
    await client.query(
      `INSERT INTO order_invoice_numbers (order_id, invoice_number)
       VALUES ($1, $2)`,
      [orderId, invoiceNumber],
    );
    await client.query("COMMIT");
    return invoiceNumber;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
