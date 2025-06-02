import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import QuizCard from "@/components/quiz-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, TrendingUp, Award, Clock, Flame, Trophy } from "lucide-react";
import type { Theme, UserStats } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const { data: themes, isLoading: themesLoading } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  const { data: userStatsData, isLoading: statsLoading } = useQuery<{
    stats: UserStats[];
    totalQuizzes: number;
    recentSessions: any[];
  }>({
    queryKey: ["/api/users/me/stats"],
  });

  const { data: globalLeaderboard } = useQuery<Array<any>>({
    queryKey: ["/api/leaderboard/global"],
  });

  if (themesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const userStats = userStatsData?.stats || [];
  const totalQuizzes = userStatsData?.totalQuizzes || 0;
  const averageScore = userStats.length > 0 
    ? Math.round(userStats.reduce((sum, stat) => sum + stat.averageScore, 0) / userStats.length)
    : 0;
  const totalBadges = user?.badges?.length || 0;
  const totalTimeSpent = userStats.reduce((sum, stat) => sum + stat.totalTimeSpent, 0);
  const totalTimeHours = Math.round(totalTimeSpent / 3600);

  // Find user rank in global leaderboard
  const userRank = globalLeaderboard?.findIndex(u => u.id === user?.id) + 1 || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
              <p className="text-gray-600">Choisissez un thème et testez vos connaissances !</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Série:</span>
                  <span className="font-bold text-orange-600">{user?.streak || 0} jours</span>
                </div>
              </div>
              {userRank > 0 && (
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Rang:</span>
                    <span className="font-bold text-yellow-600">#{userRank}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Quiz joués</p>
                  <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Play className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Score moyen</p>
                  <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Badges obtenus</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBadges}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Temps total</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTimeHours}h</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quiz Themes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Thèmes disponibles</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes?.map((theme) => {
              const themeStats = userStats.find(s => s.themeId === theme.id);
              return (
                <QuizCard
                  key={theme.id}
                  theme={theme}
                  stats={themeStats}
                />
              );
            })}
          </div>
        </div>

        {/* Recent Activity & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Activité récente</h3>
              <div className="space-y-4">
                {userStatsData?.recentSessions?.length ? (
                  userStatsData.recentSessions.map((session, index) => {
                    const theme = themes?.find(t => t.id === session.themeId);
                    return (
                      <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Play className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Quiz {theme?.name} terminé
                          </p>
                          <p className="text-xs text-gray-500">
                            Score: {session.score}/{session.totalQuestions} - {new Date(session.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucune activité récente. Commencez un quiz pour voir vos statistiques !
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Players */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Top joueurs</h3>
              <div className="space-y-3">
                {globalLeaderboard?.slice(0, 5).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.id === user?.id 
                        ? 'bg-indigo-50 border border-indigo-200' 
                        : index === 0 
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`font-medium ${
                        player.id === user?.id ? 'text-indigo-700' : 'text-gray-900'
                      }`}>
                        {player.id === user?.id ? 'Vous' : `${player.firstName} ${player.lastName}`}
                      </span>
                    </div>
                    <span className={`font-bold ${
                      player.id === user?.id ? 'text-indigo-600' :
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      index === 2 ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {player.totalScore} pts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
