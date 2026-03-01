import express from "express";
import { otpLimiter } from "../middleware/rateLimiter.js";
import { getMe, sendOtp, verifyOTP } from "../controllerts/AuthController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOTP);


router.get("/me", auth, getMe)

export default router