import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});


// Request interceptor — attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quiz_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage and redirect to login
      localStorage.removeItem('quiz_token')
      localStorage.removeItem('quiz_user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance