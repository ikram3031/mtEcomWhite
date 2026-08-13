import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { buildOtpEmailHtml } from "../src/templates/otpEmailTemplate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const sendTestEmail = async (targetEmail, targetName, otp) => {
  try {
    const isPort465 = Number(process.env.SMTP_PORT) === 465;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: isPort465,
      tls: { rejectUnauthorized: false },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const htmlContent = buildOtpEmailHtml({
      name: targetName,
      otp,
      logoUrl: "https://server.engulfic.com/uploads/logo_horizontal.png"
    });

    const info = await transport.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Engulfic'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: "Your Verification Code — Engulfic",
      html: htmlContent,
    });

    console.log(`Email to ${targetEmail} sent successfully! Status: ${info.response}`);
  } catch (error) {
    console.error(`Failed to send email to ${targetEmail}:`, error);
  }
};

const runAll = async () => {
  await sendTestEmail("ihkhan2027@gmail.com", "Iftakher H. Khan", "458129");
  await sendTestEmail("maherhasan502@gmail.com", "Maher Hasan", "792410");
};

runAll();
