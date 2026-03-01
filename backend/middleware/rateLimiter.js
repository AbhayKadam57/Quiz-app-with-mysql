import rateLimit from "express-rate-limit";

export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false
})


export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
