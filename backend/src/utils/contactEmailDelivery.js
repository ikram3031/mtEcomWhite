import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { UserModel } from "../models/user.model.js";

let defaultTransport;

// Dynamically retrieve or initialize SMTP transport
const getTransport = () => {
  if (!defaultTransport) {
    const isSecure =
      Number(env.SMTP_PORT) === 465 ||
      String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl";

    defaultTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: isSecure,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return defaultTransport;
};

const lightThemeHtml = (title, body) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
  .container { max-w-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .content { font-size: 15px; line-height: 1.6; color: #334155; }
  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${title}</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${env.SMTP_FROM_NAME || "Our Store"}. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

// Sends acknowledgment email to the customer who submitted the contact form
export const sendContactAcknowledgment = async ({ name, email, message }) => {
  try {
    if (!env.SMTP_USER || !env.SMTP_PASSWORD || !email) return;

    const transport = getTransport();
    const fromName = env.SMTP_FROM_NAME || "Store Contact";
    const fromAddress = `"${fromName}" <${env.SMTP_FROM || env.SMTP_USER}>`;

    const customerHtml = lightThemeHtml(
      "Thank you for contacting us!",
      `<p>Hi ${name || "Valued Customer"},</p>
       <p>We have received your message and our support team will get back to you as soon as possible.</p>
       <p><strong>Your Message:</strong></p>
       <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; color: #475569; border-left: 4px solid #0284c7;">
         ${(message || "").replace(/\n/g, "<br>")}
       </div>
       <p style="margin-top: 20px;">Best regards,<br>The ${fromName} Team</p>`
    );

    await transport.sendMail({
      from: fromAddress,
      to: email,
      subject: `Thank you for contacting ${fromName}`,
      html: customerHtml,
    });
  } catch (error) {
    console.error("Error sending contact acknowledgment email:", error);
  }
};

// Sends an email reply from the dashboard admin to the customer
export const sendContactReplyEmail = async ({
  toEmail,
  customerName,
  originalMessage,
  replyMessage,
  adminName,
}) => {
  try {
    if (!env.SMTP_USER || !env.SMTP_PASSWORD || !toEmail) {
      throw new Error("SMTP credentials or recipient email missing");
    }

    const transport = getTransport();
    const fromName = env.SMTP_FROM_NAME || "Customer Support";
    const fromAddress = `"${fromName}" <${env.SMTP_FROM || env.SMTP_USER}>`;

    const replyHtml = lightThemeHtml(
      `Response to your inquiry`,
      `<p>Hi ${customerName || "there"},</p>
       <div style="font-size: 15px; line-height: 1.6; color: #0f172a; margin: 15px 0;">
         ${(replyMessage || "").replace(/\n/g, "<br>")}
       </div>
       <p style="color: #64748b; font-size: 13px; margin-top: 25px;">— ${adminName || "Support Team"}, ${fromName}</p>
       <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0 15px 0;" />
       <p style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;"><strong>Your Original Message:</strong></p>
       <blockquote style="font-size: 13px; color: #64748b; margin: 0; padding: 10px 15px; background: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 4px;">
         ${(originalMessage || "").replace(/\n/g, "<br>")}
       </blockquote>`
    );

    const info = await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Re: Your inquiry on ${fromName}`,
      html: replyHtml,
    });

    return info;
  } catch (error) {
    console.error("Error sending contact reply email:", error);
    throw error;
  }
};
