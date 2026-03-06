import { startSession, getMyResult, retakeQuiz } from "@/api/sessionApi";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw, PlayCircle, Loader2, Trophy } from "lucide-react";
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

  const [sessionStatus, setSessionStatus] = useState("loading");
  const [actionLoading, setActionLoading] = useState(false);
  const [attemptsInfo, setAttemptsInfo] = useState({ attemptsToday: 0, attemptsRemaining: 3, dailyLimit: 3 });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getMyResult();
        if (response.success && response.result) {
          setSessionStatus(response.result.status);
          setAttemptsInfo({
            attemptsToday: response.attemptsToday ?? 0,
            attemptsRemaining: response.attemptsRemaining ?? 3,
            dailyLimit: response.dailyLimit ?? 3,
          });

          if (response.result.status === "started") {
            setSessionId(response.result.id);
          }
          return;
        }

        setSessionStatus("none");
      } catch (e) {
        if (e?.response?.status === 404) {
          setSessionStatus("none");
        } else {
          setSessionStatus("none");
        }
      }
    };

    checkSession();
  }, [setSessionId]);

  const syncAttempts = (response) => {
    setAttemptsInfo({
      attemptsToday: response?.attemptsToday ?? attemptsInfo.attemptsToday,
      attemptsRemaining: response?.attemptsRemaining ?? attemptsInfo.attemptsRemaining,
      dailyLimit: response?.dailyLimit ?? attemptsInfo.dailyLimit,
    });
  };

  const handleStartQuiz = async () => {
    setActionLoading(true);
    try {
      const response = await startSession();
      if (response.success) {
        syncAttempts(response);
        setSessionId(response.sessionId);
        toast.success(response.message, { position: "top-center" });
        navigate("/start-quiz");
      }
    } catch (e) {
      syncAttempts(e?.response?.data);
      toast.error(e.response?.data?.message || "Error starting quiz", { position: "top-center" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeQuiz = () => navigate("/start-quiz");

  const handleRetakeQuiz = async () => {
    setActionLoading(true);
    try {
      const response = await retakeQuiz();
      if (response.success) {
        syncAttempts(response);
        reset();
        setSessionId(response.sessionId);
        toast.success(response.message, { position: "top-center" });
        navigate("/start-quiz");
      }
    } catch (e) {
      syncAttempts(e?.response?.data);
      toast.error(e?.response?.data?.message || "Error starting new attempt", {
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
        <Button disabled className="bg-[#0f766e] text-white opacity-70">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Checking...
        </Button>
      );
    }

    if (sessionStatus === "started") {
      return (
        <Button className="bg-[#0f766e] hover:bg-[#115e59] text-white" onClick={handleResumeQuiz} disabled={actionLoading}>
          <PlayCircle size={18} className="mr-2" />
          Resume Innings
        </Button>
      );
    }

    if (sessionStatus === "completed") {
      return (
        <Button className="bg-[#0f766e] hover:bg-[#115e59] text-white" onClick={handleRetakeQuiz} disabled={actionLoading}>
          {actionLoading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <RefreshCw size={18} className="mr-2" />}
          {actionLoading ? "Starting..." : "Start Next Attempt"}
        </Button>
      );
    }

    return (
      <Button className="bg-[#0f766e] hover:bg-[#115e59] text-white" onClick={handleStartQuiz} disabled={actionLoading}>
        {actionLoading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <PlayCircle size={18} className="mr-2" />}
        {actionLoading ? "Starting..." : "Start IPL Quiz"}
      </Button>
    );
  };

  return (
    <div className="w-full min-h-screen flex gap-2 p-4 flex-col items-center justify-center bg-[#edf4f2] font-[inter]">
      <img src="/Planning.png" alt="Quiz" className="md:w-[20%] object-contain" />
      <h2 className="text-[#0f766e] text-center text-[2.5rem] font-bold">IPL Quiz Arena</h2>
      <p className="text-center max-w-2xl">Three attempts per day. Leaderboard rank is based on your best innings.</p>

      <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-white border border-[#99f6e4]">
        <Trophy size={18} className="text-[#0f766e]" />
        <p className="text-sm font-semibold text-gray-700">
          Attempts today: {attemptsInfo.attemptsToday}/{attemptsInfo.dailyLimit} | Left: {attemptsInfo.attemptsRemaining}
        </p>
      </div>

      {sessionStatus === "completed" && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-4 py-2 mt-1">
          Previous attempt completed. Start the next attempt if you still have turns left today.
        </p>
      )}

      {sessionStatus === "started" && (
        <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-4 py-2 mt-1">
          You already have an active innings. Resume and finish it first.
        </p>
      )}

      <div className="flex gap-4 mt-3">
        {renderActionButton()}
        <Button variant="outline" className="border-[#0f766e] text-[#0f766e] hover:bg-red-50" onClick={handleLogout}>
          <LogOut size={20} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default StartPage;
