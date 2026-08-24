import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { UserModel } from "../models/user.model.js";

let defaultTransport;

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

export async function sendContactEmails({ name, email, phone, message }) {
  try {
    if (!env.SMTP_USER || !env.SMTP_PASSWORD) return;

    const transport = getTransport();
    const fromName = env.SMTP_FROM_NAME || "Store Contact";
    const fromAddress = `"${fromName}" <${env.SMTP_FROM || env.SMTP_USER}>`;

    // 1. Find all owners
    const owners = await UserModel.find({ role: "Owner" }).select("email");
    const ownerEmails = owners.map((o) => o.email).filter(Boolean);

    // 2. Send to Owners
    if (ownerEmails.length > 0) {
      const adminHtml = lightThemeHtml(
        "New Contact Form Submission",
        `<p><strong>Name:</strong> ${name}</p>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Phone:</strong> ${phone || "N/A"}</p>
         <p><strong>Message:</strong></p>
         <div style="background: #f1f5f9; padding: 15px; border-radius: 6px;">
           ${message.replace(/\n/g, "<br>")}
         </div>`
      );

      await transport.sendMail({
        from: fromAddress,
        to: ownerEmails.join(", "),
        subject: `New Contact Submission from ${name}`,
        html: adminHtml,
      });
    }

    // 3. Send Thank You to Customer
    if (email) {
      const customerHtml = lightThemeHtml(
        "Thank you for contacting us!",
        `<p>Hi ${name},</p>
         <p>We have received your message and our team will get back to you as soon as possible.</p>
         <p><strong>Your Message:</strong></p>
         <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; color: #64748b;">
           ${message.replace(/\n/g, "<br>")}
         </div>
         <p>Best regards,<br>The ${fromName} Team</p>`
      );

      await transport.sendMail({
        from: fromAddress,
        to: email,
        subject: `Thank you for contacting ${fromName}`,
        html: customerHtml,
      });
    }
  } catch (error) {
    console.error("Error sending contact emails:", error);
  }
}
