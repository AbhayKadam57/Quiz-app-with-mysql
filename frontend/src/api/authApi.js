import axiosInstance from './axiosInstance'

// Send OTP to mobile number
export const sendOTP = async (mobile, name) => {
  const res = await axiosInstance.post('/auth/send-otp', { mobile, name })
  return res.data
}

// Verify OTP — returns token + user
export const verifyOTP = async (mobile, otp) => {
  const res = await axiosInstance.post('/auth/verify-otp', { mobile, otp })
  return res.data
}

// Get current logged-in user
export const getMe = async () => {
  const res = await axiosInstance.get('/auth/me')
  return res.data
}