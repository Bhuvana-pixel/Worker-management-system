// backend/utils/sentOtp.js
import transporter from "../config/email.js";

export const sendOtpEmail = async (toEmail, otp, role) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`OTP for ${toEmail} (${role}): ${otp} (Email not configured - OTP logged for testing)`);
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: 'Password Reset OTP - Worker Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your ${role} account.</p>
          <p>Your OTP (One-Time Password) is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>Worker Management System Team</p>
        </div>
      `
    });
    console.log("OTP email sent to:", toEmail);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};