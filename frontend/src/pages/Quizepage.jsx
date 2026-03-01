import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import useQuizStore from '@/store/quizStore';
import { getQuestions } from '@/api/quizApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import QuizStarted from './QuizStarted';

const Quizepage = () => {
  const navigate = useNavigate();
  const { setQuestions, questions } = useQuizStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log('Fetching questions...');
        const token = localStorage.getItem('quiz_token');
        console.log('Auth token present:', !!token);
        
        setLoading(true);
        const response = await getQuestions();
        
        console.log('Full API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        console.log('Questions in response:', response?.questions);
        console.log('Questions length:', response?.questions?.length);
        
        // Handle successful response
        if (response?.questions && Array.isArray(response.questions) && response.questions.length > 0) {
          console.log('✅ Setting questions to store:', response.questions);
          setQuestions(response.questions);
          
          // Verify immediately
          console.log('After setQuestions, store state:', useQuizStore.getState().questions.length);
          
          setQuestionsLoaded(true);
          setLoading(false);
        } else {
          console.error('❌ Invalid response structure or no questions:', response);
          setError('No questions found in response');
          setLoading(false);
          toast.error('No questions found', { position: 'top-center' });
        }
      } catch (error) {
        console.error('❌ API Error:', error);
        console.error('Error response:', error?.response);
        console.error('Error status:', error?.response?.status);
        console.error('Error data:', error?.response?.data);
        
        if (error?.response?.status === 401) {
          setError('Unauthorized - Please log in again');
          toast.error('Session expired. Please log in again.', { position: 'top-center' });
        } else if (error?.response?.status === 404) {
          setError('Questions endpoint not found');
          toast.error('API endpoint error', { position: 'top-center' });
        } else {
          const errorMessage = error?.response?.data?.message || error?.message || 'Error loading questions';
          setError(errorMessage);
          toast.error(errorMessage, { position: 'top-center' });
        }
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [setQuestions]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#e8ebea] flex items-center justify-center p-6">
        <Card className="p-8 max-w-md shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <AlertCircle size={32} className="text-red-600" />
            <h2 className="text-2xl font-bold text-gray-800">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/start')}
            className="w-full bg-[#2c8c72] hover:bg-[#1f6b54] text-white"
          >
            Go Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8ebea] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c8c72] mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions && questions.length > 0 && questionsLoaded) {
    return <QuizStarted />;
  }

  return (
    <div className="min-h-screen bg-[#e8ebea] flex items-center justify-center p-6">
      <Card className="p-8 text-center max-w-md shadow-lg">
        <p className="text-gray-600">Preparing quiz...</p>
      </Card>
    </div>
  );
};

export default Quizepage;