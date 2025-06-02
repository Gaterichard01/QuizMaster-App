import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Brain, Play, Tags, Plus, Edit, Trash2, Shield, BarChart3 } from "lucide-react";
import type { Theme, Question, User } from "@shared/schema";

const themeSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().min(1, "La description est requise"),
  icon: z.string().min(1, "L'icône est requise"),
  color: z.string().min(1, "La couleur est requise"),
  isActive: z.boolean().optional(),
});

const questionSchema = z.object({
  question: z.string().min(1, "La question est requise"),
  options: z.array(z.string()).length(4, "4 options sont requises"),
  correctAnswer: z.number().min(0).max(3, "La réponse correcte doit être entre 0 et 3"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
});

type ThemeFormData = z.infer<typeof themeSchema>;
type QuestionFormData = z.infer<typeof questionSchema>;

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Redirect if not authenticated or not admin
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: adminStats, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    totalThemes: number;
    totalSessions: number;
    activeThemes: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: themes, isLoading: themesLoading } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: [`/api/themes/${selectedThemeId}/questions`],
    enabled: !!selectedThemeId,
  });

  const { data: globalLeaderboard } = useQuery<Array<User & { totalScore: number }>>({
    queryKey: ["/api/leaderboard/global"],
  });

  // Theme form
  const themeForm = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "fas fa-brain",
      color: "blue",
      isActive: true,
    },
  });

  // Question form
  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      difficulty: "medium",
      explanation: "",
    },
  });

  // Theme mutations
  const createThemeMutation = useMutation({
    mutationFn: async (data: ThemeFormData) => {
      const response = await apiRequest("POST", "/api/themes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsThemeDialogOpen(false);
      themeForm.reset();
      toast({ title: "Thème créé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ThemeFormData }) => {
      const response = await apiRequest("PUT", `/api/themes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      setIsThemeDialogOpen(false);
      setEditingTheme(null);
      themeForm.reset();
      toast({ title: "Thème modifié avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/themes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Thème supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Question mutations
  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest("POST", `/api/themes/${selectedThemeId}/questions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/themes/${selectedThemeId}/questions`] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      toast({ title: "Question créée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuestionFormData }) => {
      const response = await apiRequest("PUT", `/api/questions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/themes/${selectedThemeId}/questions`] });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      questionForm.reset();
      toast({ title: "Question modifiée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/questions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/themes/${selectedThemeId}/questions`] });
      toast({ title: "Question supprimée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleThemeSubmit = (data: ThemeFormData) => {
    if (editingTheme) {
      updateThemeMutation.mutate({ id: editingTheme.id, data });
    } else {
      createThemeMutation.mutate(data);
    }
  };

  const handleQuestionSubmit = (data: QuestionFormData) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const openThemeDialog = (theme?: Theme) => {
    if (theme) {
      setEditingTheme(theme);
      themeForm.reset(theme);
    } else {
      setEditingTheme(null);
      themeForm.reset();
    }
    setIsThemeDialogOpen(true);
  };

  const openQuestionDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      questionForm.reset({
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        explanation: question.explanation || "",
      });
    } else {
      setEditingQuestion(null);
      questionForm.reset();
    }
    setIsQuestionDialogOpen(true);
  };

  if (statsLoading || themesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-red-600 text-white p-3 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panneau d'Administration</h1>
              <p className="text-gray-600">Gérez les thèmes, questions et utilisateurs</p>
            </div>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900">{adminStats?.totalUsers || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Thèmes créés</p>
                  <p className="text-2xl font-bold text-gray-900">{adminStats?.totalThemes || 0}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Tags className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Parties jouées</p>
                  <p className="text-2xl font-bold text-gray-900">{adminStats?.totalSessions || 0}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Play className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Thèmes actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{adminStats?.activeThemes || 0}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="themes">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="themes">Gestion des Thèmes</TabsTrigger>
                <TabsTrigger value="questions">Gestion des Questions</TabsTrigger>
                <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              </TabsList>

              {/* Themes Tab */}
              <TabsContent value="themes" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Gestion des Thèmes</h3>
                  <Button onClick={() => openThemeDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Thème
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Thème</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {themes?.map((theme) => (
                        <tr key={theme.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                theme.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                theme.color === 'green' ? 'bg-green-100 text-green-600' :
                                theme.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                theme.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                                theme.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                theme.color === 'red' ? 'bg-red-100 text-red-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                <i className={theme.icon}></i>
                              </div>
                              <span className="font-medium text-gray-900">{theme.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600 max-w-xs truncate">
                            {theme.description}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={theme.isActive ? "default" : "secondary"}>
                              {theme.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openThemeDialog(theme)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteThemeMutation.mutate(theme.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Gestion des Questions</h3>
                    <p className="text-gray-600">Sélectionnez un thème pour voir ses questions</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select value={selectedThemeId?.toString()} onValueChange={(value) => setSelectedThemeId(parseInt(value))}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choisir un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        {themes?.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id.toString()}>
                            {theme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => openQuestionDialog()}
                      disabled={!selectedThemeId}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle Question
                    </Button>
                  </div>
                </div>

                {selectedThemeId && (
                  <div className="space-y-4">
                    {questionsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Card key={i}>
                            <CardContent className="p-4">
                              <Skeleton className="h-20 w-full" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      questions?.map((question) => (
                        <Card key={question.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  {question.options.map((option, index) => (
                                    <div 
                                      key={index}
                                      className={`text-sm p-2 rounded ${
                                        index === question.correctAnswer 
                                          ? 'bg-green-100 text-green-800 font-medium' 
                                          : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + index)}. {option}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center space-x-4">
                                  <Badge variant="outline">{question.difficulty}</Badge>
                                  <span className="text-sm text-gray-500">
                                    Réponse correcte: {String.fromCharCode(65 + question.correctAnswer)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openQuestionDialog(question)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteQuestionMutation.mutate(question.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Top Utilisateurs</h3>
                <div className="space-y-3">
                  {globalLeaderboard?.map((user, index) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-orange-500 text-white' :
                              'bg-gray-300 text-gray-700'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                            {user.role === "admin" && (
                              <Badge variant="destructive">Admin</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{user.totalScore} pts</div>
                            <div className="text-sm text-gray-500">
                              Série: {user.streak} jours
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Theme Dialog */}
        <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTheme ? "Modifier le thème" : "Créer un nouveau thème"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={themeForm.handleSubmit(handleThemeSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du thème</Label>
                <Input
                  id="name"
                  {...themeForm.register("name")}
                  placeholder="Nom du thème"
                />
                {themeForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {themeForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...themeForm.register("description")}
                  placeholder="Description du thème"
                />
                {themeForm.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {themeForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="icon">Icône (classe Font Awesome)</Label>
                <Input
                  id="icon"
                  {...themeForm.register("icon")}
                  placeholder="fas fa-brain"
                />
                {themeForm.formState.errors.icon && (
                  <p className="text-red-500 text-sm mt-1">
                    {themeForm.formState.errors.icon.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="color">Couleur</Label>
                <Select 
                  value={themeForm.watch("color")} 
                  onValueChange={(value) => themeForm.setValue("color", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Bleu</SelectItem>
                    <SelectItem value="green">Vert</SelectItem>
                    <SelectItem value="purple">Violet</SelectItem>
                    <SelectItem value="yellow">Jaune</SelectItem>
                    <SelectItem value="indigo">Indigo</SelectItem>
                    <SelectItem value="red">Rouge</SelectItem>
                    <SelectItem value="pink">Rose</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsThemeDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
                >
                  {editingTheme ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Question Dialog */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Modifier la question" : "Créer une nouvelle question"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={questionForm.handleSubmit(handleQuestionSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  {...questionForm.register("question")}
                  placeholder="Entrez votre question"
                />
                {questionForm.formState.errors.question && (
                  <p className="text-red-500 text-sm mt-1">
                    {questionForm.formState.errors.question.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Options de réponse</Label>
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <Input
                      {...questionForm.register(`options.${index}` as const)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Réponse correcte</Label>
                <Select 
                  value={questionForm.watch("correctAnswer").toString()} 
                  onValueChange={(value) => questionForm.setValue("correctAnswer", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">A</SelectItem>
                    <SelectItem value="1">B</SelectItem>
                    <SelectItem value="2">C</SelectItem>
                    <SelectItem value="3">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Difficulté</Label>
                <Select 
                  value={questionForm.watch("difficulty")} 
                  onValueChange={(value) => questionForm.setValue("difficulty", value as "easy" | "medium" | "hard")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="explanation">Explication (optionnel)</Label>
                <Textarea
                  id="explanation"
                  {...questionForm.register("explanation")}
                  placeholder="Explication de la réponse"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsQuestionDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                >
                  {editingQuestion ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
