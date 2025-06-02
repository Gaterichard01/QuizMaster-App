import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Trophy, 
  Target, 
  Clock, 
  Award, 
  TrendingUp, 
  Play,
  Flame,
  Brain,
  Laptop,
  BookOpen,
  FlaskConical,
  Landmark,
  Globe,
  Calculator
} from "lucide-react";
import type { Theme, UserStats, QuizSession } from "@shared/schema";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const { data: themes } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  const { data: userStatsData, isLoading: statsLoading } = useQuery<{
    stats: UserStats[];
    totalQuizzes: number;
    recentSessions: QuizSession[];
  }>({
    queryKey: ["/api/users/me/stats"],
  });

  const { data: globalLeaderboard } = useQuery<Array<any>>({
    queryKey: ["/api/leaderboard/global"],
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const userStats = userStatsData?.stats || [];
  const totalQuizzes = userStatsData?.totalQuizzes || 0;
  const recentSessions = userStatsData?.recentSessions || [];
  
  const averageScore = userStats.length > 0 
    ? Math.round(userStats.reduce((sum, stat) => sum + stat.averageScore, 0) / userStats.length)
    : 0;
  
  const totalTimeSpent = userStats.reduce((sum, stat) => sum + stat.totalTimeSpent, 0);
  const totalTimeHours = Math.round(totalTimeSpent / 3600);
  
  // Find user rank in global leaderboard
  const userRank = globalLeaderboard?.findIndex(u => u.id === user?.id) + 1 || 0;

  const getBadgeInfo = (badge: string) => {
    const badgeMap: Record<string, { name: string; icon: any; color: string }> = {
      "first_quiz": { name: "Premier Quiz", icon: Trophy, color: "text-yellow-500 bg-yellow-100" },
      "streak_7": { name: "Série 7j", icon: Flame, color: "text-orange-500 bg-orange-100" },
      "expert_it": { name: "Expert IT", icon: Laptop, color: "text-blue-500 bg-blue-100" },
      "admin": { name: "Administrateur", icon: User, color: "text-red-500 bg-red-100" },
      "founder": { name: "Fondateur", icon: Award, color: "text-purple-500 bg-purple-100" },
      "expert": { name: "Expert", icon: Brain, color: "text-green-500 bg-green-100" },
    };
    return badgeMap[badge] || { name: badge, icon: Award, color: "text-gray-500 bg-gray-100" };
  };

  const getThemeIcon = (themeId: number) => {
    const theme = themes?.find(t => t.id === themeId);
    if (!theme) return Brain;
    
    const iconMap: Record<string, any> = {
      "fas fa-laptop-code": Laptop,
      "fas fa-flask": FlaskConical,
      "fas fa-book": BookOpen,
      "fas fa-landmark": Landmark,
      "fas fa-globe": Globe,
      "fas fa-calculator": Calculator,
    };
    
    return iconMap[theme.icon] || Brain;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Consultez vos statistiques et performances</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl">
                      {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-gray-600 mb-4">{user?.email}</p>
                  
                  <div className="flex items-center justify-center space-x-6 text-sm mb-4">
                    <div className="text-center">
                      <div className="font-bold text-lg text-indigo-600">{user?.points.toLocaleString()}</div>
                      <div className="text-gray-500">Points</div>
                    </div>
                    {userRank > 0 && (
                      <div className="text-center">
                        <div className="font-bold text-lg text-yellow-600">#{userRank}</div>
                        <div className="text-gray-500">Rang</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-bold text-lg text-purple-600">{user?.badges.length}</div>
                      <div className="text-gray-500">Badges</div>
                    </div>
                  </div>

                  {user?.role === "admin" && (
                    <Badge variant="destructive" className="mb-4">
                      <User className="w-3 h-3 mr-1" />
                      Administrateur
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Mes Badges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user?.badges.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {user.badges.map((badge, index) => {
                      const badgeInfo = getBadgeInfo(badge);
                      const IconComponent = badgeInfo.icon;
                      return (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg text-center border ${badgeInfo.color.replace('text-', 'border-').replace('-500', '-200')}`}
                        >
                          <IconComponent className={`w-6 h-6 mx-auto mb-2 ${badgeInfo.color.split(' ')[0]}`} />
                          <div className="text-xs font-medium">{badgeInfo.name}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Aucun badge obtenu pour le moment
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Statistiques rapides</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Quiz joués</span>
                  </div>
                  <span className="font-bold text-gray-900">{totalQuizzes}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Score moyen</span>
                  </div>
                  <span className="font-bold text-gray-900">{averageScore}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Temps total</span>
                  </div>
                  <span className="font-bold text-gray-900">{totalTimeHours}h</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-600">Série actuelle</span>
                  </div>
                  <span className="font-bold text-gray-900">{user?.streak} jours</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance by Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Performance par thème</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userStats.length > 0 ? (
                  <div className="space-y-4">
                    {userStats.map((stat) => {
                      const theme = themes?.find(t => t.id === stat.themeId);
                      const IconComponent = getThemeIcon(stat.themeId);
                      
                      return (
                        <div key={stat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              theme?.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                              theme?.color === 'green' ? 'bg-green-100 text-green-600' :
                              theme?.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                              theme?.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                              theme?.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                              theme?.color === 'red' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{theme?.name}</div>
                              <div className="text-sm text-gray-500">{stat.totalQuizzes} quiz joués</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{stat.averageScore}%</div>
                            <div className="w-20 mt-1">
                              <Progress value={stat.averageScore} className="h-2" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucune statistique disponible. Commencez un quiz pour voir vos performances !
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Activité récente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((session) => {
                      const theme = themes?.find(t => t.id === session.themeId);
                      const percentage = Math.round((session.score / session.totalQuestions) * 100);
                      const IconComponent = getThemeIcon(session.themeId);
                      
                      return (
                        <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-full ${
                            percentage >= 80 ? 'bg-green-100 text-green-600' :
                            percentage >= 60 ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Quiz {theme?.name} terminé
                            </p>
                            <p className="text-xs text-gray-500">
                              Score: {session.score}/{session.totalQuestions} ({percentage}%) - 
                              {new Date(session.completedAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{percentage}%</div>
                            <div className="text-xs text-gray-500">+{session.score * 10} pts</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucune activité récente
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Réussites récentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userStats.some(s => s.bestScore === 100) && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Trophy className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Score parfait !</div>
                        <div className="text-sm text-gray-500">Vous avez obtenu 100% dans un quiz</div>
                      </div>
                    </div>
                  )}
                  
                  {user?.streak >= 7 && (
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Flame className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Série de {user.streak} jours</div>
                        <div className="text-sm text-gray-500">Quiz joué chaque jour cette semaine</div>
                      </div>
                    </div>
                  )}
                  
                  {totalQuizzes >= 10 && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Play className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Quiz passionné</div>
                        <div className="text-sm text-gray-500">Plus de 10 quiz complétés</div>
                      </div>
                    </div>
                  )}
                  
                  {(user?.badges.length || 0) === 0 && totalQuizzes === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      Commencez un quiz pour débloquer vos premières réussites !
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
