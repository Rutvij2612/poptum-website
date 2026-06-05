import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export async function sendEmail(args: SendEmailArgs) {
  const ownerEmail = process.env.ORDER_OWNER_EMAIL || "info.poptum@gmail.com";
  const fromEmail = args.from || process.env.ORDER_FROM_EMAIL || ownerEmail;

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: args.to,
    subject: args.subject,
    text: args.text,
    replyTo: args.replyTo,
    attachments: args.attachments,
  });

  if (error) {
    throw new Error(error.message || JSON.stringify(error));
  }

  return data;
}
