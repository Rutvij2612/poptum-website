import 'dotenv/config';
import nodemailer from 'nodemailer';
import { Pool } from 'pg';

async function run() {
  console.log('Testing SMTP...');
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
    await transporter.verify();
    console.log('SMTP connection successful!');
  } catch (err: any) {
    console.error('SMTP Error:', err.message);
  }

  console.log('Testing Database URL:', process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('DB connection successful! Time:', res.rows[0].now);
  } catch (err: any) {
    console.error('DB Error:', err.message);
  }
  pool.end();
}
run();
