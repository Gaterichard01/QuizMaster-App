import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, Lightbulb, X } from "lucide-react";
import type { Theme, Question } from "@shared/schema";

interface QuizInterfaceProps {
  theme: Theme;
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer?: number;
  onAnswerSelect: (questionId: number, answerIndex: number) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function QuizInterface({
  theme,
  questions,
  currentQuestionIndex,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onBack,
  isSubmitting,
}: QuizInterfaceProps) {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    setTimeRemaining(30);
    setShowHint(false);
  }, [currentQuestionIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onNext();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, onNext]);

  const handleAnswerSelect = (answerIndex: number) => {
    onAnswerSelect(currentQuestion.id, answerIndex);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getIconColor = () => {
    const colorMap: Record<string, string> = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
      yellow: "text-yellow-600",
      indigo: "text-indigo-600",
      red: "text-red-600",
      pink: "text-pink-600",
      orange: "text-orange-600",
      cyan: "text-cyan-600",
      gray: "text-gray-600",
      emerald: "text-emerald-600",
      rose: "text-rose-600",
    };
    return colorMap[theme.color] || "text-gray-600";
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Quiz Header */}
        <div className="bg-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <i className={`${theme.icon} text-xl`}></i>
              </div>
              <div>
                <h2 className="text-xl font-bold">Quiz {theme.name}</h2>
                <p className="text-indigo-100">
                  Question {currentQuestionIndex + 1} sur {questions.length}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBack}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Timer */}
          <div className="flex items-center justify-center">
            <div className="bg-white/20 rounded-full px-4 py-2 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <CardContent className="p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h3>
            
            {showHint && currentQuestion.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Indice</span>
                </div>
                <p className="text-blue-700 text-sm">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
          
          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className={`w-full p-4 text-left justify-start border-2 transition-all duration-200 ${
                  selectedAnswer === index
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 border-2 rounded-full flex items-center justify-center font-semibold ${
                    selectedAnswer === index
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-lg font-medium">{option}</span>
                </div>
              </Button>
            ))}
          </div>
          
          {/* Quiz Actions */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost"
              onClick={() => setShowHint(!showHint)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              disabled={!currentQuestion.explanation}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Indice</span>
            </Button>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={onNext}
                disabled={isSubmitting}
              >
                Passer
              </Button>
              <Button 
                onClick={onNext}
                disabled={selectedAnswer === undefined || isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting 
                  ? "Soumission..." 
                  : isLastQuestion 
                    ? "Terminer" 
                    : "Suivant"
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
