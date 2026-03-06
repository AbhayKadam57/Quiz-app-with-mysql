import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Trophy, ShieldUser, Flame } from "lucide-react";
import useQuizStore from "@/store/quizStore";
import { completeSession, retakeQuiz } from "@/api/sessionApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChartPieDonut } from "@/UIComponents/ChartPieDonut";
import { GalleryVerticalEnd } from "lucide-react";

const ResultPage = () => {
  const navigate = useNavigate();
  const store = useQuizStore();
  const sessionId = store.sessionId;
  const answers = store.answers;
  const score = store.score;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [attemptsInfo, setAttemptsInfo] = useState({ attemptsToday: 0, attemptsRemaining: 3, dailyLimit: 3 });
  const reset = store.reset;
  const setSessionId = store.setSessionId;

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await completeSession(sessionId);

        if (response.success && response.result) {
          setResult(response.result);
          setAttemptsInfo({
            attemptsToday: response.attemptsToday ?? 0,
            attemptsRemaining: response.attemptsRemaining ?? 3,
            dailyLimit: response.dailyLimit ?? 3,
          });
          toast.success("Innings completed", { position: "top-center" });
        } else {
          toast.error("Failed to load result", { position: "top-center" });
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Error completing quiz", {
          position: "top-center",
        });
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  const handleRetakeQuiz = async () => {
    try {
      setIsRetaking(true);
      const response = await retakeQuiz();
      if (response.success) {
        reset();
        setSessionId(response.sessionId);
        toast.success(response.message, { position: "top-center" });
        navigate("/start-quiz");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error starting next attempt", {
        position: "top-center",
      });
    } finally {
      setIsRetaking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edf4f2] flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Loading results...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#edf4f2] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-4">No results found</p>
          <Button onClick={() => navigate("/start")} className="bg-[#0f766e] hover:bg-[#115e59]">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const correctCount = result.totalCorrect ?? answers.filter((a) => a.isCorrect).length;
  const totalAnswered = result.totalAnswered || answers.length;
  const incorrectCount = totalAnswered - correctCount;
  const percentageVal = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
  const percentage = percentageVal.toFixed(1);
  const timeInSeconds = result.totalTimeTaken || 0;
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  let running = 0;
  let bestStreak = 0;
  for (const answer of answers) {
    running = answer.isCorrect ? running + 1 : 0;
    bestStreak = Math.max(bestStreak, running);
  }

  return (
    <div className="min-h-screen bg-[#edf4f2] p-6">
      <div className="w-full mx-auto flex flex-col">
        <div className="text-center mb-8">
          <Trophy size={64} className="mx-auto text-[#0f766e] mb-4" />
          <h1 className="text-4xl font-bold text-[#0f766e] mb-2">Innings Complete</h1>
          <p className="text-gray-600">Best-score leaderboard is auto-updated from your top attempt.</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Card className="p-8 mb-6 shadow-lg bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <ChartPieDonut
                total={100}
                score={correctCount * 10 || score || 0}
                title="Total score"
                subtitle="Latest innings score"
              />
              <ChartPieDonut
                total={100}
                score={isNaN(parseFloat(percentage)) ? 0 : parseFloat(percentage)}
                title="Accuracy"
                subtitle="Latest innings accuracy"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg">
                <GalleryVerticalEnd className="mx-auto text-green-600 mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-2">Answered</p>
                <p className="text-2xl font-bold text-gray-800">{totalAnswered}</p>
              </div>

              <div className="text-center p-4 rounded-lg">
                <CheckCircle className="mx-auto text-green-600 mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-1">Correct</p>
                <p className="text-2xl font-bold">{correctCount}</p>
              </div>

              <div className="text-center p-4 rounded-lg">
                <XCircle className="mx-auto text-red-600 mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-1">Incorrect</p>
                <p className="text-2xl font-bold">{incorrectCount}</p>
              </div>

              <div className="text-center p-4 rounded-lg">
                <Flame className="mx-auto text-orange-500 mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-1">Best Streak</p>
                <p className="text-2xl font-bold">{bestStreak}</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 justify-between shadow-lg bg-white">
            <Card className="p-6 shadow-lg flex-1 mb-4">
              <Clock size={32} className="mx-auto text-[#0f766e]" />
              <p className="text-center text-sm text-gray-600 mb-2">Time Taken</p>
              <p className="text-center text-4xl font-bold text-[#0f766e]">
                {minutes}m {seconds}s
              </p>
            </Card>

            {result?.rank && (
              <Card className="p-6 shadow-lg flex-1 mb-4">
                <ShieldUser className="mx-auto text-[#0f766e]" size={48} />
                <p className="text-center text-sm text-gray-600 mb-2">Current Rank</p>
                <p className="text-center text-4xl font-bold text-[#0f766e]">{result.rank}</p>
              </Card>
            )}

            <p className="text-sm text-gray-700 text-center mb-4">
              Attempts today: {attemptsInfo.attemptsToday}/{attemptsInfo.dailyLimit} | Remaining: {attemptsInfo.attemptsRemaining}
            </p>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/leaderboard")} className="w-full bg-[#0f766e] hover:bg-[#115e59] text-white text-lg py-6">
                View Leaderboard
              </Button>
              <Button
                onClick={handleRetakeQuiz}
                variant="outline"
                disabled={isRetaking}
                className="w-full text-lg py-6 border-[#0f766e] text-[#0f766e]"
              >
                {isRetaking ? "Starting..." : "Start Next Attempt"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
