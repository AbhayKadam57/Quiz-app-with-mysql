import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import useQuizStore from "@/store/quizStore";
import { submitAnswer } from "@/api/sessionApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

  // Compute derived values directly from state (not from getters)
  const currentQuestion =
    questions && questions.length > 0 ? questions[currentIndex] : null;
  const totalQuestions = questions ? questions.length : 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isFirstQuestion = currentIndex === 0;
  const answeredQuestion = currentQuestion
    ? store.answers.find((a) => a.questionId === currentQuestion.id)
    : null;

  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (questions && questions.length > 0) {
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
    // Stop timer if question already answered or time is up
    if (timeLeft <= 0 || answeredQuestion) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, answeredQuestion]);

  const autoSubmitWrong = async () => {
  if (!currentQuestion) return;

  try {
    setIsSubmitting(true);

    const response = await submitAnswer({
      sessionId,
      questionId: currentQuestion.id,
      selectedOption: null, // No option selected
      timeTaken: 30,
    });

    // Save as wrong
    saveAnswer({
      questionId: currentQuestion.id,
      selectedOption: null,
      isCorrect: false,
      timeTaken: 30,
      scoreEarned: 0,
    });

    toast.error("Time's up! Moving to next question.", {
      position: "top-center",
    });

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
}, [timeLeft]);

  // Show loading while questions are being fetched
  if (!isReady || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#e8ebea] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c8c72] mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  // Defensive: If currentQuestion is null, show error and prevent option rendering crash
  if (
    isReady &&
    (!currentQuestion || Object.keys(currentQuestion).length === 0)
  ) {
    return (
      <div className="min-h-screen bg-[#e8ebea] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c8c72] mb-4"></div>
          <p className="text-xl font-semibold text-red-600">
            No question found. Please try again.
          </p>
        </div>
      </div>
    );
  }

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

      console.log("Submit answer response:", response);

      if (response.success) {
        const isCorrect = response.isCorrect;
        saveAnswer({
          questionId: currentQuestion?.id,
          selectedOption,
          isCorrect,
          timeTaken: 30 - timeLeft,
          scoreEarned: response.scoreEarned,
        });

        console.log("After saveAnswer - isLastQuestion:", isLastQuestion);

        toast.success(response.message, { position: "top-center" });

        if (!isLastQuestion) {
          console.log("Moving to next question");
          nextQuestion();
        } else {
          console.log(
            "Last question answered! Should show Get My Result button",
          );
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

  const handlePrevious = () => {
    previousQuestion();
  };

  const handleNext = () => {
    if (answeredQuestion) {
      nextQuestion();
    } else {
      toast.error("Please answer the question first", {
        position: "top-center",
      });
    }
  };

  const handleGetResult = () => {
    navigate("/result");
  };

  // useEffect(() => {
  //   if (timeLeft == 30) {
  //     nextQuestion();
  //   }
  // }, [timeLeft]);

  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const timerColor = timeLeft <= 10 ? "text-red-600" : "text-[#2c8c72]";

  return (
    <div className="min-h-screen bg-[#e8ebea] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2c8c72]">Quiz Challenge</h1>
          <div
            className={`flex items-center gap-2 text-2xl font-bold ${timerColor}`}
          >
            <Clock size={32} />
            {timeLeft}s
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8">
            {currentQuestion?.question || "Loading question..."}
          </h2>

          {/* Options */}
          <div className="space-y-4">
            {currentQuestion?.options ? (
              // New format from backend
              Object.entries(currentQuestion.options).map(
                ([label, optionText]) => (
                  <button
                    key={label}
                    onClick={() => setSelectedOption(label)}
                    disabled={isSubmitting}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                      selectedOption === label
                        ? "border-[#2c8c72] bg-[#2c8c72] text-white"
                        : "border-gray-300 hover:border-[#2c8c72] bg-white text-gray-800"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="font-bold">{label}</span>. {optionText}
                  </button>
                ),
              )
            ) : // Old format fallback
            currentQuestion ? (
              ["option_a", "option_b", "option_c", "option_d"].map(
                (optionKey, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const optionText = currentQuestion?.[optionKey];

                  return (
                    <button
                      key={optionKey}
                      onClick={() => setSelectedOption(label)}
                      disabled={isSubmitting}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                        selectedOption === label
                          ? "border-[#2c8c72] bg-[#2c8c72] text-white"
                          : "border-gray-300 hover:border-[#2c8c72] bg-white text-gray-800"
                      } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="font-bold">{label}</span>. {optionText}
                    </button>
                  );
                },
              )
            ) : (
              <div className="text-center text-gray-600">Loading option...</div>
            )}
          </div>
        </Card>

        <div className="flex justify-between items-center gap-4">
          <Button
            onClick={handlePrevious}
            disabled={isFirstQuestion || isSubmitting}
            variant="outline"
            className="flex items-center gap-2 text-[12px] md:text-[16px]"
          >
            <ChevronLeft size={20} />
            Previous
          </Button>

          {isLastQuestion && answeredQuestion ? (
            <Button
              onClick={handleGetResult}
              className="bg-[#2c8c72] hover:bg-[#1f6b54] text-white px-8 font-semibold text-lg text-[12px] md:text-[16px]"
            >
              Get My Result
            </Button>
          ) : (
            <Button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !selectedOption}
              className="bg-[#2c8c72] hover:bg-[#1f6b54] text-white px-8 text-[12px] md:text-[16px]"
            >
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={isLastQuestion || !answeredQuestion || isSubmitting}
            className="flex items-center gap-2 text-[12px] md:text-[16px]"
            variant="outline"
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
