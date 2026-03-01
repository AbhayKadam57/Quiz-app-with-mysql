import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('quiz_token') || null,
  user: JSON.parse(localStorage.getItem('quiz_user') || 'null'),

  setAuth: (token, user) => {
    localStorage.setItem('quiz_token', token)
    localStorage.setItem('quiz_user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('quiz_token')
    localStorage.removeItem('quiz_user')
    set({ token: null, user: null })
  },
}))

export default useAuthStore