import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Brain } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "user",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur QuizMaster !",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur QuizMaster !",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Erreur lors de l'inscription",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="bg-indigo-600 text-white p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isRegister ? "Inscription" : "Connexion"}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {isRegister 
                ? "Créez votre compte pour commencer à jouer"
                : "Connectez-vous pour commencer à jouer"
              }
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isRegister ? (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    {...registerForm.register("firstName")}
                    placeholder="Votre prénom"
                    className="mt-1"
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {registerForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    {...registerForm.register("lastName")}
                    placeholder="Votre nom"
                    className="mt-1"
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {registerForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  {...registerForm.register("username")}
                  placeholder="Votre nom d'utilisateur"
                  className="mt-1"
                />
                {registerForm.formState.errors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...registerForm.register("email")}
                  placeholder="votre@email.com"
                  className="mt-1"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...registerForm.register("password")}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...registerForm.register("confirmPassword")}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Inscription..." : "S'inscrire"}
              </Button>
            </form>
          ) : (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register("email")}
                  placeholder="votre@email.com"
                  className="mt-1"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...loginForm.register("password")}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          )}

          <div className="text-center">
            <p className="text-gray-600">
              {isRegister ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-indigo-600 font-semibold"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Se connecter" : "S'inscrire"}
              </Button>
            </p>
          </div>

          {/* Demo Accounts */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 text-center mb-3">Comptes de démonstration :</p>
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 p-2 rounded text-center">
                <strong>Admin:</strong> admin@quizmaster.com / admin123
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <strong>Utilisateur:</strong> john.doe@email.com / user123
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
