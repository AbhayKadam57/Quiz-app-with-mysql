import { startSession, getMyResult, retakeQuiz } from "@/api/sessionApi";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw, PlayCircle, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useQuizStore from "@/store/quizStore";
import useAuthStore from "@/store/authStore";

const StartPage = () => {
  const navigate = useNavigate();
  const setSessionId = useQuizStore((s) => s.setSessionId);
  const reset = useQuizStore((s) => s.reset);
  const logout = useAuthStore((s) => s.logout);

  // 'loading' | 'none' | 'started' | 'completed'
  const [sessionStatus, setSessionStatus] = useState("loading");
  const [actionLoading, setActionLoading] = useState(false);

  // On mount, check if the user already has a session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getMyResult();
        if (response.success && response.result) {
          setSessionStatus(response.result.status); // 'started' or 'completed'
          // If there's an active session, restore its ID in the store
          if (response.result.status === "started") {
            setSessionId(response.result.id);
          }
        } else {
          setSessionStatus("none");
        }
      } catch (e) {
        // 404 means no session exists yet — that's fine
        if (e?.response?.status === 404) {
          setSessionStatus("none");
        } else {
          setSessionStatus("none");
        }
      }
    };
    checkSession();
  }, [setSessionId]);

  const handleStartQuiz = async () => {
    setActionLoading(true);
    try {
      const response = await startSession();
      if (response.success) {
        setSessionId(response.sessionId);
        toast.success(response.message, { position: "top-center" });
        navigate("/start-quiz");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error starting quiz", {
        position: "top-center",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeQuiz = () => {
    navigate("/start-quiz");
  };

  const handleRetakeQuiz = async () => {
    setActionLoading(true);
    try {
      const response = await retakeQuiz();
      if (response.success) {
        reset();
        setSessionId(response.sessionId);
        toast.success(response.message, { position: "top-center" });
        navigate("/start-quiz");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Error retaking quiz", {
        position: "top-center",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    reset();
    toast.success("Logged out successfully", { position: "top-center" });
    navigate("/");
  };

  const renderActionButton = () => {
    if (sessionStatus === "loading") {
      return (
        <Button disabled className="bg-[#2c8c72] text-white opacity-70">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Checking...
        </Button>
      );
    }

    if (sessionStatus === "started") {
      return (
        <Button
          className="bg-[#2c8c72] hover:bg-[#1f6b54] text-white"
          onClick={handleResumeQuiz}
          disabled={actionLoading}
        >
          <PlayCircle size={18} className="mr-2" />
          Resume Quiz
        </Button>
      );
    }

    if (sessionStatus === "completed") {
      return (
        <Button
          className="bg-[#2c8c72] hover:bg-[#1f6b54] text-white"
          onClick={handleRetakeQuiz}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <RefreshCw size={18} className="mr-2" />
          )}
          {actionLoading ? "Starting..." : "Retake Quiz"}
        </Button>
      );
    }

    // 'none' — fresh start
    return (
      <Button
        className="bg-[#2c8c72] hover:bg-[#1f6b54] text-white"
        onClick={handleStartQuiz}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <Loader2 size={18} className="mr-2 animate-spin" />
        ) : (
          <PlayCircle size={18} className="mr-2" />
        )}
        {actionLoading ? "Starting..." : "Start a Quiz"}
      </Button>
    );
  };

  return (
    <div className="w-full h-screen flex gap-2 p-4 flex-col items-center justify-center bg-[#e8ebea] font-[inter]">
      <img src="/Planning.png" alt="" className="md:w-[20%] object-contain" />
      <h2 className="text-[#2c8c72] text-center text-[2.5rem] font-bold">
        Get Started with exciting quizes
      </h2>
      <p className="text-center">
        Ready to play? Start the quiz and show what you know!
      </p>

      {sessionStatus === "completed" && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-2 mt-1">
          🏆 You've already completed this quiz. Click{" "}
          <strong>Retake Quiz</strong> to play again!
        </p>
      )}
      {sessionStatus === "started" && (
        <p className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-4 py-2 mt-1">
          ⏳ You have an ongoing quiz session. Click{" "}
          <strong>Resume Quiz</strong> to continue!
        </p>
      )}

      <div className="flex gap-4 mt-3">
        {renderActionButton()}
        <Button
          variant="outline"
          className="border-[#2c8c72] text-[#2c8c72] hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut size={20} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default StartPage;
