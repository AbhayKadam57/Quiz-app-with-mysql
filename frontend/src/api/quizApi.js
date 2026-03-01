import axiosInstance from './axiosInstance'

// Fetch all 10 questions (called once at start)
export const getQuestions = async () => {
  const res = await axiosInstance.get('/quiz/questions')
  return res.data
}