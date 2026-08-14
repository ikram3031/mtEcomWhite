import nodemailer from "nodemailer";
import { buildOtpEmailHtml } from "../templates/otpEmailTemplate.js";
import { env } from "../config/env.js";

// Cached SMTP transport connection instance
let defaultTransport;

// Dynamically retrieve/initialize SMTP transport to avoid race conditions with dotenv load order
function getTransport() {
  if (!defaultTransport) {
    defaultTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }
  return defaultTransport;
}

export async function sendOtpEmail({
  toEmail,
  otp,
  name,
  type = "registration",
  transport,
  log = console,
}) {
  const activeTransport = transport || getTransport();

  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    return {
      delivered: false,
      reason: "SMTP credentials are not configured",
    };
  }

  const isForgotPassword = type === "forgot-password";
  const subject = isForgotPassword
    ? "Your Decantre Password Reset Code"
    : "Your OTP verification code";
  const text = isForgotPassword
    ? `Hello ${name || "there"},\n\nUse this OTP to reset your Decantre password: ${otp}\nThis code will expire in 3 minutes.\n\nIf you did not request this, please ignore this email.`
    : `Hello ${name || "there"},\n\nYour OTP verification code is ${otp}.\nThis code will expire in 3 minutes.\n\nThank you.`;
  
  const html = buildOtpEmailHtml({ name, otp, type });

  // Format sender address to display the business name
  const fromName = env.SMTP_FROM_NAME || "Decantre BD";
  const fromEmail = env.SMTP_FROM || env.SMTP_USER;
  const fromAddress = `"${fromName}" <${fromEmail}>`;

  try {
    await activeTransport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text,
      html
    });

    return { delivered: true };
  } catch (error) {
    log.warn?.({ error, toEmail }, "OTP email delivery failed");
    return {
      delivered: false,
      reason: error.message || "OTP email delivery failed",
    };
  }
}
