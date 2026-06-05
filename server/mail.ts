import nodemailer from "nodemailer";
import { google } from "googleapis";

const SMTP_TIMEOUT_MS = 10000;
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export type AppMailAttachment = {
  filename: string;
  content: Buffer;
};

export type AppMailOptions = {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: AppMailAttachment[];
};

export function isGmailApiConfigured(): boolean {
  return !!(
    process.env.GMAIL_CLIENT_ID?.trim() &&
    process.env.GMAIL_CLIENT_SECRET?.trim() &&
    process.env.GMAIL_REFRESH_TOKEN?.trim()
  );
}

function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  );
}

export function getMailTransportMode(): "gmail_api" | "smtp" | "none" {
  if (isGmailApiConfigured()) return "gmail_api";
  if (isSmtpConfigured()) return "smtp";
  return "none";
}

export function logMailTransportMode(): void {
  const mode = getMailTransportMode();
  if (mode === "gmail_api") {
    console.log("[MAIL] Transport: Gmail API (OAuth2) — Render-friendly HTTPS");
  } else if (mode === "smtp") {
    console.log("[MAIL] Transport: SMTP (nodemailer) — localhost / paid hosting");
  } else {
    console.warn(
      "[MAIL] No mail transport configured. Set GMAIL_CLIENT_* + GMAIL_REFRESH_TOKEN, or SMTP_* env vars.",
    );
  }
}

function createSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT.trim(), 10)
      : undefined,
    secure:
      process.env.SMTP_SECURE?.trim() === "true" ||
      process.env.SMTP_PORT?.trim() === "465",
    family: 4,
    connectionTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
  } as any);
}

function encodeGmailRaw(message: Buffer): string {
  return message
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function compileMimeMessage(options: AppMailOptions): Promise<Buffer> {
  const compileTransport = nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  } as any);

  const compiled = await compileTransport.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    replyTo: options.replyTo,
    attachments: options.attachments,
  });

  const raw = (compiled as { message?: Buffer }).message;
  if (!raw) {
    throw new Error("Failed to compile MIME message for Gmail API");
  }
  return raw;
}

async function sendViaGmailApi(options: AppMailOptions): Promise<{ messageId: string }> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID!.trim(),
    process.env.GMAIL_CLIENT_SECRET!.trim(),
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN!.trim(),
  });

  const rawBuffer = await compileMimeMessage(options);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodeGmailRaw(rawBuffer),
    },
  });

  return { messageId: res.data.id ?? "gmail-api" };
}

async function sendViaSmtp(options: AppMailOptions): Promise<{ messageId: string }> {
  const transporter = createSmtpTransporter();
  const info = await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    replyTo: options.replyTo,
    attachments: options.attachments,
  });
  return { messageId: info.messageId ?? "smtp" };
}

/** Same options as nodemailer — uses Gmail API on Render when OAuth env vars are set. */
export async function sendAppMail(options: AppMailOptions): Promise<{ messageId: string }> {
  if (isGmailApiConfigured()) {
    return sendViaGmailApi(options);
  }
  if (isSmtpConfigured()) {
    return sendViaSmtp(options);
  }
  throw new Error(
    "Mail not configured: set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN (production) or SMTP_HOST, SMTP_USER, SMTP_PASS (local).",
  );
}
