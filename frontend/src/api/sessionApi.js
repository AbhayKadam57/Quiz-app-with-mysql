import axiosInstance from './axiosInstance'

// Start a new quiz session
export const startSession = async () => {
  const res = await axiosInstance.post('/session/start')
  return res.data
}

// Submit answer for one question
export const submitAnswer = async ({ sessionId, questionId, selectedOption, timeTaken }) => {
  const res = await axiosInstance.post('/session/answer', {
    sessionId,
    questionId,
    selectedOption,
    timeTaken,
  })
  return res.data
}

// Mark quiz as complete — returns final score
export const completeSession = async (sessionId) => {
  const res = await axiosInstance.post('/session/complete', { sessionId })
  return res.data
}

// Get my result
export const getMyResult = async () => {
  const res = await axiosInstance.get('/session/my-result')
  return res.data
}

// Get top 20 leaderboard
export const getLeaderboard = async () => {
  const res = await axiosInstance.get('/session/leaderboard')
  return res.data
}

// Retake quiz — clears old sessions/answers and starts fresh
export const retakeQuiz = async () => {
  const res = await axiosInstance.post('/session/retake')
  return res.data
}