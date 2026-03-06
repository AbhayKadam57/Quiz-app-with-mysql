import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import useQuizStore from "@/store/quizStore";
import { getQuestions } from "@/api/quizApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import QuizStarted from "./QuizStarted";

const Quizepage = () => {
  const navigate = useNavigate();
  const { setQuestions, questions } = useQuizStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await getQuestions();

        if (response?.questions?.length) {
          setQuestions(response.questions);
          setQuestionsLoaded(true);
          setLoading(false);
          return;
        }

        setError("No questions found in response");
        setLoading(false);
        toast.error("No questions found", { position: "top-center" });
      } catch (error) {
        if (error?.response?.status === 401) {
          setError("Unauthorized - Please log in again");
          toast.error("Session expired. Please log in again.", { position: "top-center" });
        } else if (error?.response?.status === 404) {
          setError("Questions endpoint not found");
          toast.error("API endpoint error", { position: "top-center" });
        } else {
          const errorMessage = error?.response?.data?.message || error?.message || "Error loading questions";
          setError(errorMessage);
          toast.error(errorMessage, { position: "top-center" });
        }
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [setQuestions]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#edf4f2] flex items-center justify-center p-6">
        <Card className="p-8 max-w-md shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <AlertCircle size={32} className="text-red-600" />
            <h2 className="text-2xl font-bold text-gray-800">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate("/start")} className="w-full bg-[#0f766e] hover:bg-[#115e59] text-white">
            Go Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edf4f2] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f766e] mb-4" />
          <p className="text-xl font-semibold text-gray-700">Loading IPL questions...</p>
        </div>
      </div>
    );
  }

  if (questions?.length && questionsLoaded) {
    return <QuizStarted />;
  }

  return (
    <div className="min-h-screen bg-[#edf4f2] flex items-center justify-center p-6">
      <Card className="p-8 text-center max-w-md shadow-lg">
        <p className="text-gray-600">Preparing quiz...</p>
      </Card>
    </div>
  );
};

export default Quizepage;
