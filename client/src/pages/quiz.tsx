import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import QuizInterface from "@/components/quiz-interface";
import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, Clock, Target } from "lucide-react";
import type { Theme, Question } from "@shared/schema";

export default function Quiz() {
  const { themeId } = useParams<{ themeId: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [quizState, setQuizState] = useState<{
    isStarted: boolean;
    currentQuestionIndex: number;
    answers: Record<number, number>;
    startTime: number;
    isCompleted: boolean;
  }>({
    isStarted: false,
    currentQuestionIndex: 0,
    answers: {},
    startTime: 0,
    isCompleted: false,
  });

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const { data: theme, isLoading: themeLoading } = useQuery<Theme>({
    queryKey: [`/api/themes/${themeId}`],
    enabled: !!themeId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: [`/api/themes/${themeId}/questions`],
    enabled: !!themeId,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { themeId: number; answers: Record<number, number>; timeSpent: number }) => {
      const response = await apiRequest("POST", "/api/quiz/submit", data);
      return response.json();
    },
    onSuccess: (data) => {
      setQuizState(prev => ({ ...prev, isCompleted: true }));
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/global"] });
      // Show results or redirect
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    },
  });

  const startQuiz = () => {
    setQuizState(prev => ({
      ...prev,
      isStarted: true,
      startTime: Date.now(),
    }));
  };

  const answerQuestion = (questionId: number, answerIndex: number) => {
    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answerIndex,
      },
    }));
  };

  const nextQuestion = () => {
    if (!questions) return;
    
    const nextIndex = quizState.currentQuestionIndex + 1;
    
    if (nextIndex >= questions.length) {
      // Submit quiz
      const timeSpent = Math.floor((Date.now() - quizState.startTime) / 1000);
      submitQuizMutation.mutate({
        themeId: parseInt(themeId!),
        answers: quizState.answers,
        timeSpent,
      });
    } else {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
      }));
    }
  };

  const goBack = () => {
    setLocation("/");
  };

  if (themeLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-32 mb-8" />
              <Skeleton className="h-32 w-full mb-6" />
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!theme || !questions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz non trouvé</h1>
              <p className="text-gray-600 mb-6">Le quiz demandé n'existe pas ou a été supprimé.</p>
              <Button onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (quizState.isCompleted) {
    const score = Object.values(quizState.answers).length;
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz terminé !</h1>
              <p className="text-xl text-gray-600 mb-8">
                Votre score : {score}/{questions.length} ({percentage}%)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Précision</div>
                  <div className="text-xl font-bold text-blue-600">{percentage}%</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Temps</div>
                  <div className="text-xl font-bold text-purple-600">
                    {Math.floor((Date.now() - quizState.startTime) / 60000)}min
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Points gagnés</div>
                  <div className="text-xl font-bold text-green-600">{score * 10}</div>
                </div>
              </div>
              
              <p className="text-gray-500">Redirection automatique vers le tableau de bord...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!quizState.isStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8">
              <Button 
                variant="ghost" 
                onClick={goBack}
                className="mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-full mb-6 ${
                  theme.color === 'blue' ? 'bg-blue-100' :
                  theme.color === 'green' ? 'bg-green-100' :
                  theme.color === 'purple' ? 'bg-purple-100' :
                  theme.color === 'yellow' ? 'bg-yellow-100' :
                  theme.color === 'indigo' ? 'bg-indigo-100' :
                  theme.color === 'red' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  <i className={`${theme.icon} text-3xl ${
                    theme.color === 'blue' ? 'text-blue-600' :
                    theme.color === 'green' ? 'text-green-600' :
                    theme.color === 'purple' ? 'text-purple-600' :
                    theme.color === 'yellow' ? 'text-yellow-600' :
                    theme.color === 'indigo' ? 'text-indigo-600' :
                    theme.color === 'red' ? 'text-red-600' :
                    'text-gray-600'
                  }`}></i>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz {theme.name}</h1>
                <p className="text-gray-600 mb-8">{theme.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Questions</div>
                    <div className="text-2xl font-bold text-gray-900">{questions.length}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Durée estimée</div>
                    <div className="text-2xl font-bold text-gray-900">{Math.ceil(questions.length * 0.5)}min</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Points max</div>
                    <div className="text-2xl font-bold text-gray-900">{questions.length * 10}</div>
                  </div>
                </div>
                
                <Button 
                  onClick={startQuiz}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Commencer le quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <QuizInterface
        theme={theme}
        questions={questions}
        currentQuestionIndex={quizState.currentQuestionIndex}
        selectedAnswer={quizState.answers[questions[quizState.currentQuestionIndex]?.id]}
        onAnswerSelect={answerQuestion}
        onNext={nextQuestion}
        onBack={goBack}
        isSubmitting={submitQuizMutation.isPending}
      />
    </div>
  );
}
