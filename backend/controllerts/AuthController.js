import db from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendOTPviaSMS } from "../utils/sendSMS.js";

dotenv.config();

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (req, res) => {
  const { mobile, name } = req.body;

  if (!mobile) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile number is required!" });
  }

  const cleanMobile = mobile.replace(/^(\+91|91)/, "").trim();

  if (!/^\d{10}$/.test(cleanMobile)) {
    return res
      .status(400)
      .json({ success: false, message: "Enter a valid 10 digit number." });
  }

  try {
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const [existing] = await db.query(`SELECT id FROM users WHERE mobile = ?`, [
      cleanMobile,
    ]);

    if (existing.length > 0) {
      // Update OTP; also update name only if a name was actually provided
      if (name && name.trim()) {
        await db.query(
          `UPDATE users SET otp = ?, otp_expires_at = ?, name = ? WHERE mobile = ?`,
          [otp, otpExpiry, name.trim(), cleanMobile],
        );
      } else {
        await db.query(
          `UPDATE users SET otp = ?, otp_expires_at = ? WHERE mobile = ?`,
          [otp, otpExpiry, cleanMobile],
        );
      }
    } else {
      await db.query(
        `INSERT INTO users (name, mobile, otp, otp_expires_at) VALUES (?, ?, ?, ?)`,
        [name ? name.trim() : null, cleanMobile, otp, otpExpiry],
      );
    }

    const smsResult = await sendOTPviaSMS(cleanMobile, otp);

    if (!smsResult.success) {
      console.log("SMS failed, Dev otp for ", cleanMobile);
    }

    res.status(200).json({
      success: true,
      message: `OTP send successfully to ${cleanMobile}`,
    });
  } catch (err) {
    console.log("sencOTP error", err.message);

    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyOTP = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile and OTP is required" });
  }

  const cleanMobile = mobile.replace(/^(\+91||91)/, "").trim();

  try {
    const [users] = await db.query(`SELECT * FROM users WHERE mobile = ?`, [
      cleanMobile,
    ]);

    if ((users.length === 0)) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const user = users[0];

    if (user.otp !== otp) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid OTP. Please try again." });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(401).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    await db.query(
      `UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL WHERE id = ?`,
      [user.id],
    );

    const token = jwt.sign(
      {
        userId: user.id,
        mobile: user.mobile,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE_IN },
    );

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
      },
    });
  } catch (err) {
    console.error("verifyOTP Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
};

export const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, mobile, is_verified, created_at FROM users WHERE id = ?`,
      [req.user.userId],
    );

    if (users.length === 0) {
      return res
        .staus(404)
        .json({ success: false, message: "Users not found." });
    }
    res.status(200).json({ success: true, user: users[0] });
  } catch (err) {
    console.error("getMe Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
