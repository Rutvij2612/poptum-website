import 'dotenv/config';
import nodemailer from 'nodemailer';

async function run() {
  console.log('Testing SMTP sending...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.ORDER_FROM_EMAIL || process.env.ORDER_OWNER_EMAIL,
      to: process.env.ORDER_OWNER_EMAIL,
      subject: 'Test Email from Node',
      text: 'Hello world! This is a test from Poptum catalog.',
      replyTo: 'test@example.com'
    });
    console.log('Email sent successfully!', info.messageId);
  } catch (err) {
    console.error('SMTP Send Error:', err);
  }
}
run();
