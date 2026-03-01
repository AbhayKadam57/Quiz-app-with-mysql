quiz-frontend/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── api/
│   │   ├── axiosInstance.js        # Base axios setup with token
│   │   ├── authApi.js              # send-otp, verify-otp calls
│   │   ├── quizApi.js              # get questions call
│   │   └── sessionApi.js           # start, answer, complete, leaderboard
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn auto-generated components
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── card.jsx
│   │   │   ├── progress.jsx
│   │   │   └── badge.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── MobileForm.jsx      # Enter mobile number
│   │   │   └── OtpForm.jsx         # Enter OTP
│   │   │
│   │   ├── quiz/
│   │   │   ├── QuestionCard.jsx    # Shows question + 4 options
│   │   │   ├── OptionButton.jsx    # Single option A/B/C/D
│   │   │   ├── TimerBar.jsx        # Countdown timer
│   │   │   └── ProgressBar.jsx     # Q1 of 10 progress
│   │   │
│   │   ├── result/
│   │   │   ├── ScoreCard.jsx       # Final score display
│   │   │   └── LeaderboardTable.jsx # Top 20 users
│   │   │
│   │   └── shared/
│   │       ├── Loader.jsx          # Loading spinner
│   │       ├── ErrorMessage.jsx    # Error display
│   │       └── ProtectedRoute.jsx  # Redirect if not logged in
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx           # Mobile + OTP forms
│   │   ├── StartPage.jsx           # Welcome + Start button
│   │   ├── QuizPage.jsx            # Main quiz screen
│   │   ├── ResultPage.jsx          # Score + rank
│   │   └── LeaderboardPage.jsx     # Top scorers
│   │
│   ├── store/
│   │   ├── authStore.js            # Zustand — token, user
│   │   └── quizStore.js            # Zustand — questions, sessionId, score
│   │
│   ├── hooks/
│   │   ├── useTimer.js             # Custom hook for countdown
│   │   └── useQuiz.js              # Quiz logic hook
│   │
│   ├── utils/
│   │   └── helpers.js              # Format time, score etc.
│   │
│   ├── App.jsx                     # Routes setup
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Tailwind base styles
│
├── .env
├── index.html
├── vite.config.js
├── tailwind.config.js
├── components.json                 # shadcn config
└── package.json