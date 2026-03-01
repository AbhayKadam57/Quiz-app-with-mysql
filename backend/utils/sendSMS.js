import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const sendOTPviaSMS = async (mobile, otp) => {
  try {
    const cleanMobile = mobile.replace(/^(\+91|91)/, "").trim();

    if (cleanMobile.length !== 10) {
      return {
        success: false,
        error: "Invalid mobile number. Must be 10 digit",
      };
    }

    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        message: `Your Quiz OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
        language: "english",
        route: "q",
        numbers: cleanMobile,
      },
      headers: {
        "cache-control": "no-cache",
      },
      timeout: 10000,
    });

    if (response.data && response.data.return === true) {
      console.log(`OTP SMS sent to ${cleanMobile}`);

      return { success: true, data: response.data };
    } else {
      console.error("FASTSMS error:", response.data);
      return {
        success: false,
        error: response.data?.message || "SMS sending failed",
      };
    }
  } catch (error) {
    console.error(
      "SMS error",
      error.response.message || "Error while sending SMS",
    );
    return {
      success: false,
      error: error.response.data.message || error.message,
    };
  }
};
