import { create } from 'zustand'

const useQuizStore = create((set, get) => ({
  sessionId: null,
  questions: [],
  currentIndex: 0,
  answers: [],       // { questionId, selectedOption, isCorrect, timeTaken }
  score: 0,
  result: null,
  questionStartTime: null,
  totalTimeSpent: 0,

  setSessionId: (id) => set({ sessionId: id }),

  setQuestions: (questions) => set({ questions, currentIndex: 0, answers: [], score: 0, totalTimeSpent: 0 }),

  saveAnswer: ({ questionId, selectedOption, isCorrect, timeTaken, scoreEarned }) => {
    const answers = [...get().answers, { questionId, selectedOption, isCorrect, timeTaken }]
    set({ 
      answers, 
      score: get().score + (scoreEarned || 0),
      totalTimeSpent: get().totalTimeSpent + timeTaken
    })
  },

  nextQuestion: () => set((state) => ({ currentIndex: state.currentIndex + 1, questionStartTime: Date.now() })),

  previousQuestion: () => set((state) => ({ currentIndex: Math.max(0, state.currentIndex - 1) })),

  setResult: (result) => set({ result }),

  setQuestionStartTime: () => set({ questionStartTime: Date.now() }),

  get currentQuestion() {
    const state = get()
    return state.questions[state.currentIndex] || null
  },

  get isLastQuestion() {
    const state = get()
    return state.currentIndex === state.questions.length - 1
  },

  get isFirstQuestion() {
    return get().currentIndex === 0
  },

  get totalQuestions() {
    return get().questions.length
  },

  get answeredQuestion() {
    const state = get()
    return state.answers.find(a => a.questionId === state.currentQuestion?.id)
  },

  reset: () => set({
    sessionId: null,
    questions: [],
    currentIndex: 0,
    answers: [],
    score: 0,
    result: null,
    questionStartTime: null,
    totalTimeSpent: 0,
  }),
}))

export default useQuizStore