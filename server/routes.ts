import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || "quiz-master-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé - Admin requis" });
    }
    
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà" });
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris" });
      }

      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || "user",
      });

      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.validatePassword(data.email, data.password);
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides" });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.json({ message: "Déconnexion réussie" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non connecté" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // Theme routes
  app.get("/api/themes", async (req, res) => {
    try {
      const themes = await storage.getAllThemes();
      res.json(themes);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des thèmes" });
    }
  });

  app.get("/api/themes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const theme = await storage.getTheme(id);
      
      if (!theme) {
        return res.status(404).json({ message: "Thème non trouvé" });
      }
      
      res.json(theme);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du thème" });
    }
  });

  app.post("/api/themes", requireAdmin, async (req, res) => {
    try {
      const theme = await storage.createTheme(req.body);
      res.json(theme);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création du thème" });
    }
  });

  app.put("/api/themes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const theme = await storage.updateTheme(id, req.body);
      
      if (!theme) {
        return res.status(404).json({ message: "Thème non trouvé" });
      }
      
      res.json(theme);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du thème" });
    }
  });

  app.delete("/api/themes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTheme(id);
      
      if (!success) {
        return res.status(404).json({ message: "Thème non trouvé" });
      }
      
      res.json({ message: "Thème supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du thème" });
    }
  });

  // Question routes
  app.get("/api/themes/:themeId/questions", requireAuth, async (req, res) => {
    try {
      const themeId = parseInt(req.params.themeId);
      const questions = await storage.getQuestionsByTheme(themeId);
      
      // Remove correct answers for non-admin users
      const user = await storage.getUser(req.session.userId);
      if (user?.role !== "admin") {
        const questionsWithoutAnswers = questions.map(q => {
          const { correctAnswer, explanation, ...questionWithoutAnswer } = q;
          return questionWithoutAnswer;
        });
        return res.json(questionsWithoutAnswers);
      }
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des questions" });
    }
  });

  app.post("/api/themes/:themeId/questions", requireAdmin, async (req, res) => {
    try {
      const themeId = parseInt(req.params.themeId);
      const question = await storage.createQuestion({
        ...req.body,
        themeId,
      });
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la question" });
    }
  });

  app.put("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.updateQuestion(id, req.body);
      
      if (!question) {
        return res.status(404).json({ message: "Question non trouvée" });
      }
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la question" });
    }
  });

  app.delete("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteQuestion(id);
      
      if (!success) {
        return res.status(404).json({ message: "Question non trouvée" });
      }
      
      res.json({ message: "Question supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de la question" });
    }
  });

  // Quiz routes
  app.post("/api/quiz/submit", requireAuth, async (req, res) => {
    try {
      const { themeId, answers, timeSpent } = req.body;
      
      if (!themeId || !answers || typeof timeSpent !== "number") {
        return res.status(400).json({ message: "Données manquantes" });
      }

      const questions = await storage.getQuestionsByTheme(themeId);
      let score = 0;
      const results: Array<{ questionId: number; correct: boolean; correctAnswer: number }> = [];

      questions.forEach((question, index) => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        
        if (isCorrect) {
          score++;
        }
        
        results.push({
          questionId: question.id,
          correct: isCorrect,
          correctAnswer: question.correctAnswer,
        });
      });

      const session = await storage.createQuizSession({
        userId: req.session.userId,
        themeId,
        score,
        totalQuestions: questions.length,
        timeSpent,
      });

      res.json({
        session,
        score,
        totalQuestions: questions.length,
        results,
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la soumission du quiz" });
    }
  });

  // User stats routes
  app.get("/api/users/me/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.session.userId);
      const sessions = await storage.getUserQuizSessions(req.session.userId);
      
      res.json({
        stats,
        totalQuizzes: sessions.length,
        recentSessions: sessions.slice(-5).reverse(),
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/users/me/stats/:themeId", requireAuth, async (req, res) => {
    try {
      const themeId = parseInt(req.params.themeId);
      const stats = await storage.getUserStatsByTheme(req.session.userId, themeId);
      const sessions = await storage.getUserQuizSessions(req.session.userId);
      const themeSessions = sessions.filter(s => s.themeId === themeId);
      
      res.json({
        stats,
        sessions: themeSessions.reverse(),
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques du thème" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard/global", async (req, res) => {
    try {
      const leaderboard = await storage.getGlobalLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du classement global" });
    }
  });

  app.get("/api/leaderboard/theme/:themeId", async (req, res) => {
    try {
      const themeId = parseInt(req.params.themeId);
      const leaderboard = await storage.getThemeLeaderboard(themeId);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du classement du thème" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getGlobalLeaderboard();
      const themes = await storage.getAllThemes();
      
      const totalUsers = users.length;
      const totalThemes = themes.length;
      
      // Calculate total quiz sessions across all users
      let totalSessions = 0;
      for (const user of users) {
        const sessions = await storage.getUserQuizSessions(user.id);
        totalSessions += sessions.length;
      }

      res.json({
        totalUsers,
        totalThemes,
        totalSessions,
        activeThemes: themes.filter(t => t.isActive).length,
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques admin" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
