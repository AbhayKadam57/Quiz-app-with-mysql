import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Quizepage from "./pages/Quizepage";
import ProtectedRoute from "./shared/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import StartPage from "./pages/StartPage";
import ResultPage from "./pages/ResultPage";
import LeaderboardPage from "./pages/LeaderboardPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        {/* Protected */}
        <Route
          path="/start"
          element={
            <ProtectedRoute>
              <StartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/start-quiz"
          element={
            <ProtectedRoute>
              <Quizepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
