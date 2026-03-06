import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react";
import useQuizStore from "@/store/quizStore";
import { submitAnswer } from "@/api/sessionApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MILESTONE_MAP = {
  2: { label: "Powerplay On", tone: "powerplay" },
  3: { label: "Hat-trick", tone: "hattrick" },
  5: { label: "Half-century Streak", tone: "fifty" },
  7: { label: "Super Over Surge", tone: "super" },
  10: { label: "Perfect Innings", tone: "perfect" },
};

const CONFETTI_COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#eab308"];

const QuizStarted = () => {
  const navigate = useNavigate();
  const store = useQuizStore();
  const {
    currentIndex,
    sessionId,
    nextQuestion,
    previousQuestion,
    saveAnswer,
    setQuestionStartTime,
    questions,
  } = store;

  const currentQuestion = questions?.length ? questions[currentIndex] : null;
  const totalQuestions = questions?.length || 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isFirstQuestion = currentIndex === 0;
  const answeredQuestion = currentQuestion
    ? store.answers.find((a) => a.questionId === currentQuestion.id)
    : null;

  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [milestone, setMilestone] = useState(null);

  useEffect(() => {
    if (questions?.length) {
      setIsReady(true);
    }
  }, [questions]);

  useEffect(() => {
    setTimeLeft(30);
    setQuestionStartTime();
    setSelectedOption(answeredQuestion?.selectedOption || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (timeLeft <= 0 || answeredQuestion) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, answeredQuestion]);

  useEffect(() => {
    if (!milestone) return;
    const timeout = setTimeout(() => setMilestone(null), 1800);
    return () => clearTimeout(timeout);
  }, [milestone]);

  const showMilestone = (nextStreak) => {
    const hit = MILESTONE_MAP[nextStreak];
    if (!hit) return;

    setMilestone(hit);
    const message = nextStreak === 3 ? "Hat-trick! 3 correct in a row." : `${hit.label}! ${nextStreak} in a row.`;
    toast.success(message, { position: "top-center" });
  };

  const handleStreakUpdate = (isCorrect) => {
    if (isCorrect) {
      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      setMaxStreak((prev) => Math.max(prev, nextStreak));
      showMilestone(nextStreak);
      return;
    }

    setCurrentStreak(0);
  };

  const autoSubmitWrong = async () => {
    if (!currentQuestion) return;

    try {
      setIsSubmitting(true);

      await submitAnswer({
        sessionId,
        questionId: currentQuestion.id,
        selectedOption: null,
        timeTaken: 30,
      });

      saveAnswer({
        questionId: currentQuestion.id,
        selectedOption: null,
        isCorrect: false,
        timeTaken: 30,
        scoreEarned: 0,
      });

      handleStreakUpdate(false);

      if (!isLastQuestion) {
        nextQuestion();
      }
    } catch (error) {
      console.error("Auto submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && !answeredQuestion && !isSubmitting) {
      autoSubmitWrong();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSubmitAnswer = async () => {
    if (!selectedOption) {
      toast.error("Please select an option", { position: "top-center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitAnswer({
        sessionId,
        questionId: currentQuestion?.id,
        selectedOption,
        timeTaken: 30 - timeLeft,
      });

      if (response.success) {
        saveAnswer({
          questionId: currentQuestion?.id,
          selectedOption,
          isCorrect: response.isCorrect,
          timeTaken: 30 - timeLeft,
          scoreEarned: response.scoreEarned,
        });

        handleStreakUpdate(response.isCorrect);

        if (!isLastQuestion) {
          nextQuestion();
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error(error.response?.data?.message || "Error submitting answer", {
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const timerColor = timeLeft <= 10 ? "text-red-600" : "text-[#0f766e]";

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${(i * 13) % 100}%`,
        delay: `${(i % 8) * 0.08}s`,
      })),
    [],
  );

  if (!isReady || !questions?.length) {
    return (
      <div className="min-h-screen bg-[#edf4f2] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f766e] mb-4" />
          <p className="text-xl font-semibold text-gray-700">Loading IPL questions...</p>
        </div>
      </div>
    );
  }

  if (isReady && !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#edf4f2] flex items-center justify-center">
        <p className="text-xl font-semibold text-red-600">No question found. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf4f2] p-6 relative overflow-hidden">
      {milestone && (
        <div className="celebration-overlay pointer-events-none">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="confetti-piece"
              style={{ backgroundColor: piece.color, left: piece.left, animationDelay: piece.delay }}
            />
          ))}
          <div className="celebration-banner">
            <Sparkles size={24} />
            <span>{milestone.label}</span>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold tracking-widest text-[#f59e0b]">IPL QUIZ</p>
            <h1 className="text-3xl font-extrabold text-[#0f766e]">Cricket Knowledge Innings</h1>
          </div>
          <div className={`flex items-center gap-2 text-2xl font-bold ${timerColor}`}>
            <Clock size={30} />
            {timeLeft}s
          </div>
        </div>

        <Card className="mb-5 p-4 bg-[#083344] text-white border-none shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-[#fbbf24]" />
              <p className="font-semibold">Current Streak: {currentStreak}</p>
            </div>
            <p className="text-sm text-slate-200">Best this innings: {Math.max(maxStreak, currentStreak)}</p>
            <p className="text-xs text-slate-300">Milestones: 2, 3 (Hat-trick), 5, 7, 10</p>
          </div>
        </Card>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card className="p-8 mb-8 shadow-xl border-[#a7f3d0]">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">{currentQuestion?.question}</h2>
          <div className="space-y-4">
            {Object.entries(currentQuestion?.options || {}).map(([label, optionText]) => (
              <button
                key={label}
                onClick={() => setSelectedOption(label)}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                  selectedOption === label
                    ? "border-[#0f766e] bg-[#0f766e] text-white"
                    : "border-gray-200 hover:border-[#0f766e] bg-white text-gray-900"
                } ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="font-bold">{label}</span>. {optionText}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-between items-center gap-4">
          <Button
            onClick={previousQuestion}
            disabled={isFirstQuestion || isSubmitting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Previous
          </Button>

          {isLastQuestion && answeredQuestion ? (
            <Button
              onClick={() => navigate("/result")}
              className="bg-[#0f766e] hover:bg-[#115e59] text-white px-8 font-semibold"
            >
              Finish Innings
            </Button>
          ) : (
            <Button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !selectedOption}
              className="bg-[#0f766e] hover:bg-[#115e59] text-white px-8"
            >
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </Button>
          )}

          <Button
            onClick={() => (answeredQuestion ? nextQuestion() : toast.error("Answer this question first", { position: "top-center" }))}
            disabled={isLastQuestion || !answeredQuestion || isSubmitting}
            variant="outline"
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizStarted;

