import { authenticator } from "otplib";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { UserModel } from "../models/user.model.js";
import { comparePassword } from "../utils/password.js";
import { createAccessToken, createRefreshToken } from "./AuthController.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

// Cached SMTP transport connection instance
let defaultTransport;

// Helper to initialize/retrieve SMTP transport
const getTransport = () => {
  if (!defaultTransport) {
    defaultTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_ENCRYPTION || "TLS").toUpperCase() === "SSL",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return defaultTransport;
};

// Generates/retrieves TOTP secret and emails QR Code to user
export const sendQrCodeEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordHash +twoFactorSecret");
    if (!user || !user.passwordHash) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    // Generate secret if not already set
    let secret = user.twoFactorSecret;
    if (!secret) {
      secret = authenticator.generateSecret();
      user.twoFactorSecret = secret;
      await user.save();
    }

    // Generate OTPAuth URI
    const label = `Decantre Dashboard (${user.email})`;
    const otpauth = authenticator.keyuri(user.email, "Decantre BD", secret);

    // Generate QR Code PNG Buffer
    const qrCodeBuffer = await QRCode.toBuffer(otpauth);

    // SMTP setup
    const transport = getTransport();
    const fromName = process.env.SMTP_FROM_NAME || "Decantre BD";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromAddress = `"${fromName}" <${fromEmail}>`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #c5a880; text-align: center;">Set Up Google Authenticator</h2>
        <p>Hello ${user.name},</p>
        <p>To secure your account, scan the QR code below using the Google Authenticator app (or any compatible TOTP app):</p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="cid:qrcode" alt="Authenticator QR Code" style="border: 2px solid #ddd; padding: 10px; border-radius: 4px; width: 200px; height: 200px;" />
        </div>
        <p>Alternatively, you can manually type this key into your app:</p>
        <p style="background: #f4f4f4; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 16px; text-align: center; font-weight: bold; letter-spacing: 2px;">
          ${secret}
        </p>
        <p>After scanning, enter the 6-digit code displayed in the app to complete verification.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">This is a security notification from Decantre. If you did not trigger this request, please change your password immediately.</p>
      </div>
    `;

    await transport.sendMail({
      from: fromAddress,
      to: user.email,
      subject: "Set up Two-Factor Authentication (2FA) - Decantre Dashboard",
      text: `Hello ${user.name},\n\nScan the QR code in your Authenticator app to setup 2FA.\nSecret Key: ${secret}\n\nThank you.`,
      html: htmlContent,
      attachments: [
        {
          filename: "qrcode.png",
          content: qrCodeBuffer,
          cid: "qrcode",
        },
      ],
    });

    logger.info({ email: user.email }, "Dispatched 2FA QR code email successfully");

    res.json({
      status: "success",
      message: "A QR Code has been sent to your email. Scan it in your Authenticator app to continue.",
    });
  } catch (error) {
    next(error);
  }
};

// Verifies TOTP code, enables 2FA, and completes login by issuing tokens
export const verify2fa = async (req, res, next) => {
  try {
    const { email, password, code } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedCode = typeof code === "string" ? code.trim() : "";

    if (!normalizedEmail || !password || !trimmedCode) {
      return res.status(400).json({ status: "error", message: "Email, password, and 2FA code are required" });
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordHash +twoFactorSecret");
    if (!user || !user.passwordHash) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ status: "error", message: "2FA has not been set up yet. Please request a QR Code first." });
    }

    // Verify TOTP code
    const isTokenValid = authenticator.verify({
      token: trimmedCode,
      secret: user.twoFactorSecret,
    });

    if (!isTokenValid) {
      return res.status(400).json({ status: "error", message: "Invalid or expired 2FA code" });
    }

    // Mark 2FA as fully enabled and activated
    if (!user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
    }

    // Issue tokens and update login stats
    const refreshToken = createRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);
    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();

    const accessToken = createAccessToken(user);

    logger.info({ userId: user.id }, "2FA verified, issued auth tokens successfully");

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          did: user.did,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
        accessToken,
        accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
        refreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
