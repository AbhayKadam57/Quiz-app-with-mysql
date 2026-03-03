import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Trophy, ShieldUser } from "lucide-react";
import useQuizStore from "@/store/quizStore";
import { completeSession, getLeaderboard, retakeQuiz } from "@/api/sessionApi";
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
  const totalQuestions = store.totalQuestions;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const reset = store.reset;
  const setSessionId = store.setSessionId;

  useEffect(() => {
    const fetchResult = async () => {
      try {
        console.log("Completing session with sessionId:", sessionId);
        setLoading(true);
        const response = await completeSession(sessionId);

        console.log("Complete session response:", response);

        if (response.success && response.result) {
          console.log("Setting result:", response.result);
          setResult(response.result);
          toast.success("Quiz completed! 🎉", { position: "top-center" });
        } else {
          console.error("Invalid response structure:", response);
          toast.error("Failed to load result", { position: "top-center" });
        }
      } catch (error) {
        console.error("Error completing session:", error);
        console.error("Error response:", error?.response?.data);
        toast.error(error?.response?.data?.message || "Error completing quiz", {
          position: "top-center",
        });
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchResult();
    } else {
      console.warn("No sessionId found in store");
      setLoading(false);
    }
  }, [sessionId]);

  const handleViewLeaderboard = () => {
    navigate("/leaderboard");
  };

  const handleRetakeQuiz = async () => {
    try {
      setIsRetaking(true);
      const response = await retakeQuiz();
      if (response.success) {
        reset();
        setSessionId(response.sessionId);
        toast.success(response.message, { position: "top-center" });
        navigate("/start");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error retaking quiz", {
        position: "top-center",
      });
    } finally {
      setIsRetaking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8ebea] flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">
          Loading results...
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#e8ebea] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-4">
            No results found
          </p>
          <p className="text-sm text-gray-600 mb-4">
            SessionId: {sessionId || "Not set"}
          </p>
          <Button onClick={() => navigate("/start")} className="bg-[#2c8c72]">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const correctCount =
    result.totalCorrect != null
      ? result.totalCorrect
      : answers.filter((a) => a.isCorrect).length;
  const totalAnswered = result.totalAnswered || answers.length;
  const incorrectCount = totalAnswered - correctCount;
  const percentageVal =
    totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
  const percentage = percentageVal.toFixed(1);
  const timeInSeconds = result.totalTimeTaken || 0;
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  return (
    <div className="min-h-screen  bg-[#e8ebea] p-6">
      <div className="w-full mx-auto flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy size={64} className="mx-auto text-[#2c8c72] mb-4" />
          <h1 className="text-4xl font-bold text-[#2c8c72] mb-2">
            Quiz Completed!
          </h1>
          <p className="text-gray-600">Here's how you performed</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          {/* Score Card */}
          <Card className="p-8 mb-6 shadow-lg bg-white ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ">
              {/* Total Score */}
              <ChartPieDonut
                total={100}
                score={correctCount * 10 || score || 0}
                title="Total score"
                subtitle="Showing total score for latest quiz"
              />
              {/* Accuracy */}
              <ChartPieDonut
                total={100}
                score={
                  isNaN(parseFloat(percentage)) ? 0 : parseFloat(percentage)
                }
                title="Accuracy"
                subtitle="Showing total accuracy for latest quiz"
              />
            </div>

            {/* Questions Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg">
                <GalleryVerticalEnd
                  className="mx-auto text-green-600 mb-2"
                  size={24}
                />
                <p className="text-sm text-gray-600 mb-2">Total Questions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalAnswered}
                </p>
              </div>

              <div className="text-center p-4  rounded-lg">
                <CheckCircle
                  className="mx-auto text-green-600 mb-2"
                  size={24}
                />
                <p className="text-sm text-gray-600 mb-1">Correct</p>
                <p className="text-2xl font-bold">{correctCount}</p>
              </div>

              <div className="text-center p-4 rounded-lg">
                <XCircle className="mx-auto text-red-600 mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-1">Incorrect</p>
                <p className="text-2xl font-bold">{incorrectCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 justify-between shadow-lg bg-white">
            {/* Time Taken */}
            <Card className="p-6 shadow-lg flex-1">
              <Clock size={32} className="mx-auto text-[#2c8c72]" />

              <p className="text-center text-sm text-gray-600 mb-2">
                Time Taken
              </p>
              <p className="text-center text-4xl font-bold text-[#2c8c72]">
                {minutes}m {seconds}s
              </p>
            </Card>

            {/* Rank */}
            {result?.rank && (
              <Card className="p-6 shadow-lg flex-1">
                <ShieldUser className="mx-auto text-[#2c8c72]" size={48} />
                <p className="text-center text-sm text-gray-600 mb-2">
                  Your Rank
                </p>
                <p className="text-center text-4xl font-bold text-[#2c8c72]">
                  {result.rank}
                </p>
              </Card>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleViewLeaderboard}
                className="w-full bg-[#2c8c72] hover:bg-[#1f6b54] text-white text-lg py-6"
              >
                View Leaderboard
              </Button>
              <Button
                onClick={handleRetakeQuiz}
                variant="outline"
                disabled={isRetaking}
                className="w-full text-lg py-6 border-[#2c8c72] text-[#2c8c72]"
              >
                {isRetaking ? "Starting..." : "Retake Quiz"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
