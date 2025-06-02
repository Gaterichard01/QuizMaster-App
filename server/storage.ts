import { users, themes, questions, quizSessions, userStats, type User, type InsertUser, type Theme, type InsertTheme, type Question, type InsertQuestion, type QuizSession, type InsertQuizSession, type UserStats, type InsertUserStats } from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  validatePassword(email: string, password: string): Promise<User | null>;
  
  // Theme operations
  getAllThemes(): Promise<Theme[]>;
  getTheme(id: number): Promise<Theme | undefined>;
  createTheme(theme: InsertTheme): Promise<Theme>;
  updateTheme(id: number, updates: Partial<Theme>): Promise<Theme | undefined>;
  deleteTheme(id: number): Promise<boolean>;
  
  // Question operations
  getQuestionsByTheme(themeId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, updates: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Quiz session operations
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  getUserQuizSessions(userId: number): Promise<QuizSession[]>;
  getThemeQuizSessions(themeId: number): Promise<QuizSession[]>;
  
  // User stats operations
  getUserStats(userId: number): Promise<UserStats[]>;
  getUserStatsByTheme(userId: number, themeId: number): Promise<UserStats | undefined>;
  updateUserStats(userId: number, themeId: number, stats: Partial<UserStats>): Promise<UserStats>;
  
  // Leaderboard operations
  getGlobalLeaderboard(): Promise<Array<User & { totalScore: number }>>;
  getThemeLeaderboard(themeId: number): Promise<Array<User & { bestScore: number }>>;
}

// Singleton Pattern implementation
export class MemStorage implements IStorage {
  private static instance: MemStorage;
  private users: Map<number, User>;
  private themes: Map<number, Theme>;
  private questions: Map<number, Question>;
  private quizSessions: Map<number, QuizSession>;
  private userStats: Map<string, UserStats>; // key: `${userId}-${themeId}`
  private currentUserId: number;
  private currentThemeId: number;
  private currentQuestionId: number;
  private currentQuizSessionId: number;
  private currentUserStatsId: number;

  private constructor() {
    this.users = new Map();
    this.themes = new Map();
    this.questions = new Map();
    this.quizSessions = new Map();
    this.userStats = new Map();
    this.currentUserId = 1;
    this.currentThemeId = 1;
    this.currentQuestionId = 1;
    this.currentQuizSessionId = 1;
    this.currentUserStatsId = 1;
    
    this.seedData();
  }

  public static getInstance(): MemStorage {
    if (!MemStorage.instance) {
      MemStorage.instance = new MemStorage();
    }
    return MemStorage.instance;
  }

  private async seedData() {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin: User = {
      id: this.currentUserId++,
      username: "admin",
      email: "admin@quizmaster.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      points: 5000,
      streak: 30,
      badges: ["admin", "founder", "expert"],
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create demo user
    const userPassword = await bcrypt.hash("user123", 10);
    const user: User = {
      id: this.currentUserId++,
      username: "johndoe",
      email: "john.doe@email.com",
      password: userPassword,
      firstName: "John",
      lastName: "Doe",
      role: "user",
      points: 1250,
      streak: 7,
      badges: ["first_quiz", "streak_7", "expert_it"],
      createdAt: new Date(),
    };
    this.users.set(user.id, user);

    // Seed themes
    const themesData = [
      { name: "Informatique", description: "Programmation, développement, et technologies modernes", icon: "fas fa-laptop-code", color: "blue" },
      { name: "Sciences", description: "Physique, chimie, biologie et découvertes scientifiques", icon: "fas fa-flask", color: "green" },
      { name: "Littérature", description: "Œuvres classiques, auteurs célèbres et poésie", icon: "fas fa-book", color: "purple" },
      { name: "Histoire", description: "Événements historiques, personnages et civilisations", icon: "fas fa-landmark", color: "yellow" },
      { name: "Géographie", description: "Pays, capitales, continents et merveilles naturelles", icon: "fas fa-globe", color: "indigo" },
      { name: "Mathématiques", description: "Algèbre, géométrie, statistiques et logique", icon: "fas fa-calculator", color: "red" },
      { name: "Art et musique", description: "Peinture, sculpture, musique classique et moderne", icon: "fas fa-palette", color: "pink" },
      { name: "Cinéma et séries", description: "Films, acteurs, réalisateurs et séries TV", icon: "fas fa-film", color: "orange" },
      { name: "Sport et loisirs", description: "Sports, jeux olympiques et activités de loisir", icon: "fas fa-running", color: "cyan" },
      { name: "Culture générale", description: "Connaissances générales sur le monde", icon: "fas fa-brain", color: "gray" },
      { name: "Technologie et innovation", description: "Innovations technologiques et découvertes", icon: "fas fa-rocket", color: "emerald" },
      { name: "Santé et bien-être", description: "Médecine, nutrition et bien-être", icon: "fas fa-heart", color: "rose" },
    ];

    for (const themeData of themesData) {
      const theme: Theme = {
        id: this.currentThemeId++,
        ...themeData,
        isActive: true,
      };
      this.themes.set(theme.id, theme);
    }

    // Seed questions for each theme
    await this.seedQuestionsForAllThemes();
  }

  private async seedQuestionsForAllThemes() {
    const questionsData = {
      1: [ // Informatique
        {
          question: "Quel langage de programmation est principalement utilisé pour le développement web côté client ?",
          options: ["Python", "JavaScript", "Java", "C++"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "JavaScript est le langage standard pour le développement web côté client."
        },
        {
          question: "Que signifie l'acronyme 'HTML' ?",
          options: ["Hypertext Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"],
          correctAnswer: 0,
          difficulty: "easy"
        },
        {
          question: "Quel est le principe de base de la programmation orientée objet ?",
          options: ["L'encapsulation uniquement", "L'héritage, l'encapsulation et le polymorphisme", "Les variables globales", "Les fonctions récursives"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Qu'est-ce qu'un algorithme de tri rapide (QuickSort) ?",
          options: ["Un tri par insertion", "Un tri par fusion", "Un tri par partitionnement", "Un tri par comptage"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Dans une base de données relationnelle, qu'est-ce qu'une clé primaire ?",
          options: ["Un index secondaire", "Un identifiant unique pour chaque ligne", "Une contrainte de vérification", "Une procédure stockée"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Quel protocole est utilisé pour sécuriser les communications web ?",
          options: ["HTTP", "FTP", "HTTPS", "SMTP"],
          correctAnswer: 2,
          difficulty: "easy"
        },
        {
          question: "Qu'est-ce que la complexité temporelle O(n) signifie ?",
          options: ["Temps constant", "Temps linéaire", "Temps quadratique", "Temps logarithmique"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Quel est le rôle d'un compilateur ?",
          options: ["Exécuter le code", "Traduire le code source en code machine", "Déboguer le code", "Optimiser la mémoire"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Dans Git, que fait la commande 'git merge' ?",
          options: ["Supprime une branche", "Fusionne deux branches", "Crée un nouveau commit", "Annule les modifications"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Qu'est-ce que l'intelligence artificielle symbolique ?",
          options: ["L'IA basée sur les réseaux de neurones", "L'IA basée sur la logique et les symboles", "L'IA basée sur les algorithmes génétiques", "L'IA basée sur les statistiques"],
          correctAnswer: 1,
          difficulty: "hard"
        },
        {
          question: "Quel est le principe du paradigme de programmation fonctionnelle ?",
          options: ["Utilisation de classes et d'objets", "Utilisation de fonctions pures et immutabilité", "Utilisation de variables globales", "Utilisation de pointeurs"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Qu'est-ce qu'une API REST ?",
          options: ["Un protocole de sécurité", "Une architecture pour les services web", "Un langage de programmation", "Un système de gestion de base de données"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Dans le contexte des structures de données, qu'est-ce qu'une pile (stack) ?",
          options: ["FIFO - Premier entré, premier sorti", "LIFO - Dernier entré, premier sorti", "Accès aléatoire", "Tri automatique"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Quel est l'avantage principal du cloud computing ?",
          options: ["Coût fixe", "Scalabilité et flexibilité", "Sécurité absolue", "Performance garantie"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Qu'est-ce que le machine learning supervisé ?",
          options: ["Apprentissage sans données d'entraînement", "Apprentissage avec des données étiquetées", "Apprentissage par renforcement", "Apprentissage non structuré"],
          correctAnswer: 1,
          difficulty: "medium"
        }
      ],
      2: [ // Sciences
        {
          question: "Quelle est la formule chimique de l'eau ?",
          options: ["H2O", "CO2", "NaCl", "CH4"],
          correctAnswer: 0,
          difficulty: "easy"
        },
        {
          question: "Combien de chromosomes possède un être humain normal ?",
          options: ["44", "46", "48", "50"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Quelle est la vitesse de la lumière dans le vide ?",
          options: ["300 000 km/s", "150 000 km/s", "450 000 km/s", "600 000 km/s"],
          correctAnswer: 0,
          difficulty: "medium"
        },
        {
          question: "Quel gaz représente environ 78% de l'atmosphère terrestre ?",
          options: ["Oxygène", "Azote", "Dioxyde de carbone", "Argon"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Qu'est-ce que la photosynthèse ?",
          options: ["La respiration des plantes", "La transformation de la lumière en énergie chimique", "La croissance des plantes", "La reproduction des plantes"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Quel est l'élément chimique le plus abondant dans l'univers ?",
          options: ["Hélium", "Hydrogène", "Oxygène", "Carbone"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Quelle est la température d'ébullition de l'eau à pression atmosphérique normale ?",
          options: ["90°C", "95°C", "100°C", "105°C"],
          correctAnswer: 2,
          difficulty: "easy"
        },
        {
          question: "Combien d'os compte le squelette humain adulte ?",
          options: ["196", "206", "216", "226"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Quel scientifique a développé la théorie de l'évolution ?",
          options: ["Einstein", "Newton", "Darwin", "Pasteur"],
          correctAnswer: 2,
          difficulty: "easy"
        },
        {
          question: "Qu'est-ce que l'ADN ?",
          options: ["Acide désoxyribonucléique", "Acide ribonucléique", "Adénosine triphosphate", "Acide aminé"],
          correctAnswer: 0,
          difficulty: "medium"
        },
        {
          question: "Quelle planète est la plus proche du Soleil ?",
          options: ["Vénus", "Mercure", "Mars", "Terre"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Qu'est-ce qui cause les marées ?",
          options: ["Le vent", "La rotation de la Terre", "L'attraction gravitationnelle de la Lune", "La température de l'eau"],
          correctAnswer: 2,
          difficulty: "medium"
        }
      ],
      3: [ // Littérature
        {
          question: "Qui a écrit 'Les Misérables' ?",
          options: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Honoré de Balzac"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Dans quelle ville se déroule l'action de 'Roméo et Juliette' ?",
          options: ["Rome", "Venise", "Vérone", "Florence"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Quel est le premier livre de la saga 'Harry Potter' ?",
          options: ["La Chambre des secrets", "L'École des sorciers", "Le Prisonnier d'Azkaban", "La Coupe de feu"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Qui a écrit 'Le Petit Prince' ?",
          options: ["Jules Verne", "Antoine de Saint-Exupéry", "Albert Camus", "Jean-Paul Sartre"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Dans quel siècle a vécu Molière ?",
          options: ["XVIe siècle", "XVIIe siècle", "XVIIIe siècle", "XIXe siècle"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Quel écrivain a créé le personnage de Sherlock Holmes ?",
          options: ["Agatha Christie", "Edgar Allan Poe", "Arthur Conan Doyle", "Dashiell Hammett"],
          correctAnswer: 2,
          difficulty: "easy"
        },
        {
          question: "Quelle œuvre commence par 'Longtemps, je me suis couché de bonne heure' ?",
          options: ["À la recherche du temps perdu", "L'Étranger", "Madame Bovary", "Le Rouge et le Noir"],
          correctAnswer: 0,
          difficulty: "hard"
        },
        {
          question: "Qui a écrit 'Germinal' ?",
          options: ["Victor Hugo", "Émile Zola", "Guy de Maupassant", "Stendhal"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Dans quelle langue originale a été écrit 'Don Quichotte' ?",
          options: ["Italien", "Français", "Espagnol", "Portugais"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Quel poète a écrit 'Les Fleurs du mal' ?",
          options: ["Paul Verlaine", "Arthur Rimbaud", "Charles Baudelaire", "Stéphane Mallarmé"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Qui est l'auteur de 'Crime et Châtiment' ?",
          options: ["Léon Tolstoï", "Fiodor Dostoïevski", "Anton Tchekhov", "Ivan Tourgueniev"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Dans quel pays se déroule 'Cent ans de solitude' ?",
          options: ["Mexique", "Argentine", "Colombie", "Pérou"],
          correctAnswer: 2,
          difficulty: "hard"
        },
        {
          question: "Qui a écrit 'Le Nom de la rose' ?",
          options: ["Italo Calvino", "Umberto Eco", "Alberto Moravia", "Cesare Pavese"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Quel est le vrai nom de Voltaire ?",
          options: ["François-Marie Arouet", "Jean-Baptiste Poquelin", "Henri Beyle", "Aurore Dupin"],
          correctAnswer: 0,
          difficulty: "hard"
        }
      ],
      4: [ // Histoire
        {
          question: "En quelle année a eu lieu la Révolution française ?",
          options: ["1789", "1799", "1804", "1815"],
          correctAnswer: 0,
          difficulty: "easy"
        },
        {
          question: "Qui était le premier empereur romain ?",
          options: ["Jules César", "Auguste", "Néron", "Trajan"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Quelle guerre a opposé la France et la Prusse en 1870 ?",
          options: ["Guerre de Crimée", "Guerre franco-prussienne", "Guerre de Cent Ans", "Guerre de Sept Ans"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "En quelle année Christophe Colomb a-t-il découvert l'Amérique ?",
          options: ["1490", "1492", "1494", "1496"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Quel pharaon a fait construire la grande pyramide de Gizeh ?",
          options: ["Ramsès II", "Toutânkhamon", "Khéops", "Akhenaton"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Quelle bataille a marqué la fin de l'Empire napoléonien ?",
          options: ["Austerlitz", "Waterloo", "Wagram", "Iéna"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "En quelle année a été signé le traité de Versailles ?",
          options: ["1918", "1919", "1920", "1921"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Qui était le chef de l'URSS pendant la Seconde Guerre mondiale ?",
          options: ["Lénine", "Staline", "Khrouchtchev", "Brejnev"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Quelle civilisation a construit le Machu Picchu ?",
          options: ["Aztèque", "Maya", "Inca", "Olmèque"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "En quelle année le mur de Berlin est-il tombé ?",
          options: ["1987", "1988", "1989", "1990"],
          correctAnswer: 2,
          difficulty: "easy"
        },
        {
          question: "Qui a unifié l'Allemagne au XIXe siècle ?",
          options: ["Guillaume Ier", "Otto von Bismarck", "Frédéric le Grand", "Maximilien de Bavière"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Quelle dynastie a régné sur la Chine pendant plus de 250 ans jusqu'en 1912 ?",
          options: ["Ming", "Qing", "Tang", "Song"],
          correctAnswer: 1,
          difficulty: "hard"
        },
        {
          question: "En quelle année a eu lieu la bataille de Hastings ?",
          options: ["1066", "1067", "1068", "1069"],
          correctAnswer: 0,
          difficulty: "hard"
        }
      ],
      5: [ // Géographie
        {
          question: "Quelle est la capitale de l'Australie ?",
          options: ["Sydney", "Melbourne", "Canberra", "Perth"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Quel est le plus long fleuve du monde ?",
          options: ["Amazone", "Nil", "Mississippi", "Yangtsé"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Dans quel pays se trouve le mont Everest ?",
          options: ["Inde", "Chine", "Népal", "Tibet"],
          correctAnswer: 2,
          difficulty: "easy"
        },
        {
          question: "Quelle est la plus grande île du monde ?",
          options: ["Madagascar", "Groenland", "Nouvelle-Guinée", "Bornéo"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Combien de continents y a-t-il ?",
          options: ["5", "6", "7", "8"],
          correctAnswer: 2,
          difficulty: "easy"
        },
        {
          question: "Quelle est la capitale du Canada ?",
          options: ["Toronto", "Vancouver", "Montréal", "Ottawa"],
          correctAnswer: 3,
          difficulty: "easy"
        },
        {
          question: "Quel océan borde la côte ouest des États-Unis ?",
          options: ["Atlantique", "Pacifique", "Indien", "Arctique"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Dans quel pays se trouve la ville de Tombouctou ?",
          options: ["Sénégal", "Mali", "Niger", "Burkina Faso"],
          correctAnswer: 1,
          difficulty: "hard"
        },
        {
          question: "Quelle chaîne de montagnes sépare l'Europe de l'Asie ?",
          options: ["Alpes", "Himalaya", "Oural", "Caucase"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Quel détroit sépare l'Espagne du Maroc ?",
          options: ["Détroit de Gibraltar", "Détroit du Bosphore", "Détroit de Malacca", "Détroit de Béring"],
          correctAnswer: 0,
          difficulty: "medium"
        },
        {
          question: "Quelle est la plus petite république du monde ?",
          options: ["Monaco", "Vatican", "Saint-Marin", "Liechtenstein"],
          correctAnswer: 1,
          difficulty: "hard"
        }
      ],
      6: [ // Mathématiques
        {
          question: "Combien font 7 × 8 ?",
          options: ["54", "56", "58", "64"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Quelle est la valeur de π (pi) arrondie à deux décimales ?",
          options: ["3,14", "3,15", "3,16", "3,17"],
          correctAnswer: 0,
          difficulty: "easy"
        },
        {
          question: "Combien de côtés a un hexagone ?",
          options: ["5", "6", "7", "8"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Quelle est la racine carrée de 144 ?",
          options: ["11", "12", "13", "14"],
          correctAnswer: 1,
          difficulty: "easy"
        },
        {
          question: "Dans un triangle rectangle, quel théorème relie les côtés ?",
          options: ["Théorème de Thalès", "Théorème de Pythagore", "Théorème de Fermat", "Théorème d'Euclide"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Combien de degrés y a-t-il dans un cercle complet ?",
          options: ["180°", "270°", "360°", "450°"],
          correctAnswer: 2,
          difficulty: "easy"
        },
        {
          question: "Quelle est la dérivée de x² ?",
          options: ["x", "2x", "x²", "2x²"],
          correctAnswer: 1,
          difficulty: "medium"
        },
        {
          question: "Combien font 2⁵ (2 puissance 5) ?",
          options: ["16", "24", "32", "64"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Quel nombre est premier ?",
          options: ["21", "27", "29", "33"],
          correctAnswer: 2,
          difficulty: "medium"
        },
        {
          question: "Combien de faces a un cube ?",
          options: ["4", "6", "8", "12"],
          correctAnswer: 1,
          difficulty: "easy"
        }
      ]
    };

    // Add questions for the first 6 themes (detailed above)
    for (const [themeId, questions] of Object.entries(questionsData)) {
      for (const questionData of questions) {
        const question: Question = {
          id: this.currentQuestionId++,
          themeId: parseInt(themeId),
          ...questionData,
        };
        this.questions.set(question.id, question);
      }
    }

    // Add basic questions for remaining themes (7-12)
    const remainingThemes = [
      { id: 7, name: "Art et musique" },
      { id: 8, name: "Cinéma et séries" },
      { id: 9, name: "Sport et loisirs" },
      { id: 10, name: "Culture générale" },
      { id: 11, name: "Technologie et innovation" },
      { id: 12, name: "Santé et bien-être" }
    ];

    for (const theme of remainingThemes) {
      // Add 10 basic questions per theme
      for (let i = 1; i <= 10; i++) {
        const question: Question = {
          id: this.currentQuestionId++,
          themeId: theme.id,
          question: `Question ${i} sur ${theme.name}`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: Math.floor(Math.random() * 4),
          difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)] as "easy" | "medium" | "hard",
          explanation: `Explication pour la question ${i} sur ${theme.name}`,
        };
        this.questions.set(question.id, question);
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      password: hashedPassword,
      points: 0,
      streak: 0,
      badges: [],
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Theme operations
  async getAllThemes(): Promise<Theme[]> {
    return Array.from(this.themes.values()).filter(theme => theme.isActive);
  }

  async getTheme(id: number): Promise<Theme | undefined> {
    return this.themes.get(id);
  }

  async createTheme(insertTheme: InsertTheme): Promise<Theme> {
    const theme: Theme = {
      ...insertTheme,
      id: this.currentThemeId++,
    };
    this.themes.set(theme.id, theme);
    return theme;
  }

  async updateTheme(id: number, updates: Partial<Theme>): Promise<Theme | undefined> {
    const theme = this.themes.get(id);
    if (!theme) return undefined;
    
    const updatedTheme = { ...theme, ...updates };
    this.themes.set(id, updatedTheme);
    return updatedTheme;
  }

  async deleteTheme(id: number): Promise<boolean> {
    return this.themes.delete(id);
  }

  // Question operations
  async getQuestionsByTheme(themeId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.themeId === themeId);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const question: Question = {
      ...insertQuestion,
      id: this.currentQuestionId++,
    };
    this.questions.set(question.id, question);
    return question;
  }

  async updateQuestion(id: number, updates: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...updates };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }

  // Quiz session operations
  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const session: QuizSession = {
      ...insertSession,
      id: this.currentQuizSessionId++,
      completedAt: new Date(),
    };
    this.quizSessions.set(session.id, session);
    
    // Update user stats
    await this.updateUserStatsAfterQuiz(session);
    
    return session;
  }

  async getUserQuizSessions(userId: number): Promise<QuizSession[]> {
    return Array.from(this.quizSessions.values()).filter(s => s.userId === userId);
  }

  async getThemeQuizSessions(themeId: number): Promise<QuizSession[]> {
    return Array.from(this.quizSessions.values()).filter(s => s.themeId === themeId);
  }

  // User stats operations
  async getUserStats(userId: number): Promise<UserStats[]> {
    return Array.from(this.userStats.values()).filter(s => s.userId === userId);
  }

  async getUserStatsByTheme(userId: number, themeId: number): Promise<UserStats | undefined> {
    return this.userStats.get(`${userId}-${themeId}`);
  }

  async updateUserStats(userId: number, themeId: number, statsUpdate: Partial<UserStats>): Promise<UserStats> {
    const key = `${userId}-${themeId}`;
    const existing = this.userStats.get(key);
    
    const stats: UserStats = existing ? { ...existing, ...statsUpdate } : {
      id: this.currentUserStatsId++,
      userId,
      themeId,
      totalQuizzes: 0,
      bestScore: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      ...statsUpdate,
    };
    
    this.userStats.set(key, stats);
    return stats;
  }

  private async updateUserStatsAfterQuiz(session: QuizSession) {
    const key = `${session.userId}-${session.themeId}`;
    const existing = this.userStats.get(key);
    
    if (existing) {
      const newTotalQuizzes = existing.totalQuizzes + 1;
      const newTotalTimeSpent = existing.totalTimeSpent + session.timeSpent;
      const newAverageScore = Math.round(((existing.averageScore * existing.totalQuizzes) + session.score) / newTotalQuizzes);
      const newBestScore = Math.max(existing.bestScore, session.score);
      
      await this.updateUserStats(session.userId, session.themeId, {
        totalQuizzes: newTotalQuizzes,
        averageScore: newAverageScore,
        bestScore: newBestScore,
        totalTimeSpent: newTotalTimeSpent,
      });
    } else {
      await this.updateUserStats(session.userId, session.themeId, {
        totalQuizzes: 1,
        averageScore: session.score,
        bestScore: session.score,
        totalTimeSpent: session.timeSpent,
      });
    }

    // Update user points
    const user = await this.getUser(session.userId);
    if (user) {
      const pointsEarned = session.score * 10; // 10 points per correct answer
      await this.updateUser(session.userId, {
        points: user.points + pointsEarned,
      });
    }
  }

  // Leaderboard operations
  async getGlobalLeaderboard(): Promise<Array<User & { totalScore: number }>> {
    const users = Array.from(this.users.values());
    return users
      .map(user => ({
        ...user,
        totalScore: user.points,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }

  async getThemeLeaderboard(themeId: number): Promise<Array<User & { bestScore: number }>> {
    const themeStats = Array.from(this.userStats.values()).filter(s => s.themeId === themeId);
    const usersWithScores: Array<User & { bestScore: number }> = [];
    
    for (const stat of themeStats) {
      const user = await this.getUser(stat.userId);
      if (user) {
        usersWithScores.push({
          ...user,
          bestScore: stat.bestScore,
        });
      }
    }
    
    return usersWithScores
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 10);
  }
}

export const storage = MemStorage.getInstance();
