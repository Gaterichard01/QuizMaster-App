import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Theme, UserStats } from "@shared/schema";

interface QuizCardProps {
  theme: Theme;
  stats?: UserStats;
}

export default function QuizCard({ theme, stats }: QuizCardProps) {
  const [, setLocation] = useLocation();

  const startQuiz = () => {
    setLocation(`/quiz/${theme.id}`);
  };

  const getIconColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100", 
      purple: "text-purple-600 bg-purple-100",
      yellow: "text-yellow-600 bg-yellow-100",
      indigo: "text-indigo-600 bg-indigo-100",
      red: "text-red-600 bg-red-100",
      pink: "text-pink-600 bg-pink-100",
      orange: "text-orange-600 bg-orange-100",
      cyan: "text-cyan-600 bg-cyan-100",
      gray: "text-gray-600 bg-gray-100",
      emerald: "text-emerald-600 bg-emerald-100",
      rose: "text-rose-600 bg-rose-100",
    };
    return colorMap[color] || "text-gray-600 bg-gray-100";
  };

  const getProgressColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500", 
      yellow: "bg-yellow-500",
      indigo: "bg-indigo-500",
      red: "bg-red-500",
      pink: "bg-pink-500",
      orange: "bg-orange-500",
      cyan: "bg-cyan-500",
      gray: "bg-gray-500",
      emerald: "bg-emerald-500",
      rose: "bg-rose-500",
    };
    return colorMap[color] || "bg-gray-500";
  };

  // Mock question count - in real app this would come from API
  const questionCount = Math.floor(Math.random() * 6) + 10; // 10-15 questions
  const averageScore = stats?.averageScore || 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg group-hover:scale-110 transition-transform ${getIconColor(theme.color)}`}>
            <i className={`${theme.icon} text-xl`}></i>
          </div>
          <Badge variant="secondary" className="text-xs">
            {questionCount} questions
          </Badge>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{theme.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{theme.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 mr-4">
            <div className="flex-1">
              <Progress value={averageScore} className="h-2" />
            </div>
            <span className="text-xs text-gray-500 min-w-[3rem]">{averageScore}%</span>
          </div>
          
          <Button 
            onClick={startQuiz}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium"
          >
            Jouer
          </Button>
        </div>
        
        {stats && stats.totalQuizzes > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{stats.totalQuizzes} quiz joués</span>
              <span>Meilleur: {stats.bestScore}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
