import { users, themes, questions, quizSessions, userStats, type User, type InsertUser, type Theme, type InsertTheme, type Question, type InsertQuestion, type QuizSession, type InsertQuizSession, type UserStats, type InsertUserStats } from "@shared/schema";
import bcrypt from "bcrypt";

// Interface pour les données brutes des questions, avec explanation optionnelle
interface RawQuestionData {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  explanation?: string; // Rend explanation optionnelle
}

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
export default class MemStorage implements IStorage {
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

  public async seedQuestionsForAllThemes() {
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
        },
        {
          question: "Quel est l'objectif principal d'un pare-feu (firewall) ?",
          options: ["Accélérer la connexion Internet", "Protéger un réseau des accès non autorisés", "Compresser des fichiers", "Améliorer la qualité vidéo"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Un pare-feu surveille et filtre le trafic réseau entrant et sortant pour protéger un système."
        },
        {
          question: "Dans le développement agile, que représente un 'sprint' ?",
          options: ["Une phase de test intense", "Une période de travail courte et fixe pour accomplir un ensemble de tâches", "Une réunion quotidienne", "Le déploiement final du logiciel"],
          correctAnswer: 1,
          difficulty: "medium",
          explanation: "Un sprint est une itération de durée fixe (souvent 1 à 4 semaines) durant laquelle une équipe développe et livre des incréments de produit."
        },
        {
          question: "Qu'est-ce que le 'responsive design' en développement web ?",
          options: ["Une conception qui ne fonctionne que sur les ordinateurs de bureau", "Une conception qui s'adapte à la taille de l'écran de l'utilisateur", "Une conception qui utilise des images haute résolution", "Une conception qui charge les pages très rapidement"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Le responsive design permet aux sites web de s'afficher correctement sur une variété d'appareils, des smartphones aux écrans d'ordinateur."
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
        },
        {
          question: "Quelle est la fonction principale du système circulatoire ?",
          options: ["Digestion des aliments", "Transport de l'oxygène et des nutriments", "Production d'hormones", "Filtration du sang"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Le système circulatoire (ou cardiovasculaire) est responsable du transport du sang, de l'oxygène, des nutriments et des hormones dans tout le corps."
        },
        {
          question: "Quel type de roche se forme à partir de la solidification du magma ou de la lave ?",
          options: ["Roche sédimentaire", "Roche métamorphique", "Roche ignée (magmatique)", "Roche volcanique"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Les roches ignées, ou magmatiques, sont formées par le refroidissement et la solidification du magma ou de la lave."
        },
        {
          question: "Quelle est la principale source d'énergie pour la Terre ?",
          options: ["L'énergie géothermique", "L'énergie nucléaire", "Le Soleil", "Le vent"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "La quasi-totalité de l'énergie sur Terre provient du Soleil, directement ou indirectement."
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
        },
        {
          question: "Qui est l'auteur de '1984' ?",
          options: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "Philip K. Dick"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "George Orwell est l'auteur du célèbre roman dystopique '1984'."
        },
        {
          question: "Quel genre littéraire est souvent associé à Edgar Allan Poe ?",
          options: ["Science-fiction", "Horreur et fantastique", "Comédie romantique", "Romans historiques"],
          correctAnswer: 1,
          difficulty: "medium",
          explanation: "Edgar Allan Poe est un maître de l'horreur gothique et des récits fantastiques."
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
        },
        {
          question: "Qui était le premier président des États-Unis ?",
          options: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "John Adams"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "George Washington a été le premier président des États-Unis, en fonction de 1789 à 1797."
        },
        {
          question: "Quel empire était dirigé par les sultans ottomans ?",
          options: ["Empire byzantin", "Empire perse", "Empire ottoman", "Empire mongol"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "L'Empire ottoman était un puissant empire qui a existé pendant plus de six siècles."
        },
        {
          question: "Quelle est la date de la prise de la Bastille ?",
          options: ["14 juillet 1789", "4 août 1789", "20 juin 1789", "5 mai 1789"],
          correctAnswer: 0,
          difficulty: "easy",
          explanation: "La prise de la Bastille le 14 juillet 1789 est considérée comme le début de la Révolution française."
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
        },
        {
          question: "Quel est le plus grand désert du monde (hors pôles) ?",
          options: ["Désert de Gobi", "Désert d'Arabie", "Désert du Sahara", "Désert de Kalahari"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Le Sahara est le plus grand désert chaud de la planète, couvrant une grande partie de l'Afrique du Nord."
        },
        {
          question: "Quel pays est connu comme le 'Pays du Soleil-Levant' ?",
          options: ["Chine", "Corée du Sud", "Japon", "Thaïlande"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Le Japon est traditionnellement appelé le 'Pays du Soleil-Levant' en raison de sa position à l'est de l'Asie."
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
        },
        {
          question: "Quel est le plus petit nombre entier positif divisible par 2, 3 et 4 ?",
          options: ["6", "12", "18", "24"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Le plus petit commun multiple (PPCM) de 2, 3 et 4 est 12."
        },
        {
          question: "Quelle est la somme des angles internes d'un triangle ?",
          options: ["90°", "180°", "270°", "360°"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "La somme des angles internes d'un triangle est toujours égale à 180 degrés."
        },
        {
          question: "Si un article coûte 100€ et bénéficie d'une remise de 20%, quel est son nouveau prix ?",
          options: ["70€", "80€", "90€", "120€"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "20% de 100€ est 20€, donc 100€ - 20€ = 80€."
        }
      ],
      7: [ // Art et musique
        {
          question: "Qui a peint la 'Joconde' ?",
          options: ["Vincent van Gogh", "Pablo Picasso", "Léonard de Vinci", "Claude Monet"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "La Joconde, ou Mona Lisa, est l'une des œuvres d'art les plus célèbres de Léonard de Vinci."
        },
        {
          question: "Quel compositeur a créé 'La Symphonie n° 5' ?",
          options: ["Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Ludwig van Beethoven", "Frédéric Chopin"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "La Symphonie n° 5 en ut mineur, op. 67, est l'une des œuvres les plus célèbres de Beethoven."
        },
        {
          question: "Quel mouvement artistique est caractérisé par des formes géométriques et des couleurs vives ?",
          options: ["Impressionnisme", "Surréalisme", "Cubisme", "Romantisme"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Le Cubisme est un mouvement artistique du début du XXe siècle, fondé par Pablo Picasso et Georges Braque, caractérisé par la décomposition des formes en éléments géométriques."
        },
        {
          question: "Quel instrument de musique est surnommé 'le roi des instruments' ?",
          options: ["Le piano", "Le violon", "L'orgue", "La guitare"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "L'orgue est souvent appelé 'le roi des instruments' en raison de sa taille, de sa puissance et de sa complexité."
        },
        {
          question: "Qui est l'auteur de la sculpture 'Le Penseur' ?",
          options: ["Michel-Ange", "Auguste Rodin", "Donatello", "Bernini"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Le Penseur est une sculpture emblématique de l'artiste français Auguste Rodin."
        },
        {
          question: "Quel célèbre festival de musique se déroule chaque année en Californie ?",
          options: ["Glastonbury", "Tomorrowland", "Coachella", "Rock in Rio"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Le Coachella Valley Music and Arts Festival est un grand festival de musique et d'art qui se tient annuellement à Indio, Californie."
        },
        {
          question: "Quel peintre est connu pour ses toiles de tournesols ?",
          options: ["Claude Monet", "Paul Cézanne", "Vincent van Gogh", "Pierre-Auguste Renoir"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Les séries de peintures de tournesols sont parmi les œuvres les plus reconnaissables de Vincent van Gogh."
        },
        {
          question: "Quel est le nom de la forme musicale la plus complexe, souvent associée à Bach ?",
          options: ["Sonate", "Concerto", "Fugue", "Symphonie"],
          correctAnswer: 2,
          difficulty: "hard",
          explanation: "La fugue est une forme musicale contrapuntique complexe, souvent associée à la période baroque et à des compositeurs comme J.S. Bach."
        },
        {
          question: "Qui est l'artiste derrière la chanson 'Bohemian Rhapsody' ?",
          options: ["The Beatles", "Queen", "Led Zeppelin", "Pink Floyd"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "'Bohemian Rhapsody' est l'une des chansons les plus emblématiques du groupe de rock britannique Queen."
        },
        {
          question: "Quel architecte a conçu la Sagrada Família à Barcelone ?",
          options: ["Frank Lloyd Wright", "Le Corbusier", "Antoni Gaudí", "Zaha Hadid"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Antoni Gaudí est le célèbre architecte catalan qui a débuté la construction de la Sagrada Família."
        }
      ],
      8: [ // Cinéma et séries
        {
          question: "Quel film a remporté l'Oscar du Meilleur Film en 2020 ?",
          options: ["1917", "Parasite", "Joker", "Once Upon a Time in Hollywood"],
          correctAnswer: 1,
          difficulty: "medium",
          explanation: "Le film sud-coréen 'Parasite' a marqué l'histoire en étant le premier film non anglophone à remporter l'Oscar du Meilleur Film."
        },
        {
          question: "Qui est le réalisateur du film 'Inception' ?",
          options: ["Steven Spielberg", "Christopher Nolan", "Quentin Tarantino", "Martin Scorsese"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Christopher Nolan est réputé pour ses films complexes et novateurs, dont 'Inception'."
        },
        {
          question: "Dans la série 'Friends', quel est le nom du café où les personnages se retrouvent ?",
          options: ["Central Perk", "Monk's Diner", "The Peach Pit", "MacLaren's Pub"],
          correctAnswer: 0,
          difficulty: "easy",
          explanation: "Le Central Perk est le lieu de rassemblement emblématique de la bande d'amis."
        },
        {
          question: "Quel acteur a joué le rôle de James Bond le plus longtemps ?",
          options: ["Sean Connery", "Roger Moore", "Daniel Craig", "Pierce Brosnan"],
          correctAnswer: 1,
          difficulty: "medium",
          explanation: "Roger Moore a incarné James Bond dans sept films sur une période de 12 ans (1973-1985)."
        },
        {
          question: "Quelle série télévisée se déroule dans le monde de Westeros ?",
          options: ["The Witcher", "Le Seigneur des Anneaux : Les Anneaux de Pouvoir", "Game of Thrones", "House of the Dragon"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Game of Thrones est mondialement connue pour son univers fantastique de Westeros."
        },
        {
          question: "Qui est le réalisateur du film d'animation 'Le Roi Lion' (version originale de 1994) ?",
          options: ["Don Hahn", "Roger Allers et Rob Minkoff", "John Lasseter", "Andrew Stanton"],
          correctAnswer: 1,
          difficulty: "hard",
          explanation: "Roger Allers et Rob Minkoff ont coréalisé le classique animé de Disney."
        },
        {
          question: "Quel est le nom du personnage principal de la série 'Breaking Bad' ?",
          options: ["Jesse Pinkman", "Saul Goodman", "Walter White", "Gustavo Fring"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Walter White, un professeur de chimie transformé en baron de la drogue, est le personnage central de la série."
        },
        {
          question: "Quel film est célèbre pour la réplique 'Luke, je suis ton père' ?",
          options: ["Star Wars: Un nouvel espoir", "Star Wars: Le Retour du Jedi", "Star Wars: L'Empire contre-attaque", "Star Wars: La Menace fantôme"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Cette réplique culte est prononcée par Dark Vador dans 'L'Empire contre-attaque'."
        },
        {
          question: "Quel est le nom du vaisseau spatial dans 'Star Trek' ?",
          options: ["Millennium Falcon", "Enterprise", "Serenity", "Nostromo"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "L'USS Enterprise est le vaisseau emblématique de la franchise Star Trek."
        },
        {
          question: "Quelle actrice a remporté l'Oscar de la Meilleure Actrice pour son rôle dans 'La La Land' ?",
          options: ["Natalie Portman", "Emma Stone", "Amy Adams", "Meryl Streep"],
          correctAnswer: 1,
          difficulty: "medium",
          explanation: "Emma Stone a remporté l'Oscar de la meilleure actrice pour son rôle de Mia Dolan dans 'La La Land'."
        },
        {
          question: "Quel film est le premier d'une trilogie de science-fiction majeure ?",
          options: ["Blade Runner", "Alien", "Matrix", "Dune"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "'Matrix' est le premier film de la trilogie culte des sœurs Wachowski."
        }
      ],
      9: [ // Sport et loisirs
        {
          question: "Combien de joueurs composent une équipe de football (soccer) sur le terrain ?",
          options: ["9", "10", "11", "12"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Une équipe de football est composée de 11 joueurs, y compris le gardien de but."
        },
        {
          question: "Quel pays a remporté le plus de médailles d'or aux Jeux Olympiques d'été ?",
          options: ["Chine", "Royaume-Uni", "États-Unis", "Russie"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Les États-Unis sont en tête du classement des médailles d'or olympiques."
        },
        {
          question: "Quel nageur est le plus médaillé de l'histoire des Jeux Olympiques ?",
          options: ["Ian Thorpe", "Mark Spitz", "Michael Phelps", "Ryan Lochte"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Michael Phelps détient le record du plus grand nombre de médailles olympiques, dont de nombreuses médailles d'or."
        },
        {
          question: "Quel sport utilise un 'birdie' et un 'eagle' comme termes de score ?",
          options: ["Tennis", "Basket-ball", "Golf", "Badminton"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Ces termes désignent des scores inférieurs au par sur un trou de golf."
        },
        {
          question: "Dans quel pays est né le judo ?",
          options: ["Chine", "Corée du Sud", "Japon", "Thaïlande"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Le judo est un art martial et un sport de combat d'origine japonaise, fondé par Jigoro Kano."
        },
        {
          question: "Quel est le nom de la compétition cycliste la plus célèbre au monde ?",
          options: ["Giro d'Italia", "Vuelta a España", "Tour de France", "Liège-Bastogne-Liège"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Le Tour de France est la course cycliste la plus prestigieuse et la plus suivie."
        },
        {
          question: "Combien de points vaut un essai transformé au rugby ?",
          options: ["3", "5", "7", "10"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Un essai vaut 5 points, et la transformation en ajoute 2, pour un total de 7 points."
        },
        {
          question: "Quel est le seul sport à avoir été pratiqué sur la Lune ?",
          options: ["Course à pied", "Saut en hauteur", "Lancer du javelot", "Golf"],
          correctAnswer: 3,
          difficulty: "hard",
          explanation: "Alan Shepard a frappé deux balles de golf sur la Lune lors de la mission Apollo 14."
        },
        {
          question: "Quel est le nombre maximum de joueurs sur un terrain de basket-ball (par équipe) ?",
          options: ["4", "5", "6", "7"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Au basket-ball, chaque équipe a cinq joueurs sur le terrain."
        },
        {
          question: "Quelle est la discipline qui combine natation, cyclisme et course à pied ?",
          options: ["Décathlon", "Pentathlon", "Triathlon", "Biathlon"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Le triathlon est une épreuve sportive combinant ces trois disciplines enchaînées."
        }
      ],
      10: [ // Culture générale
        {
          question: "Quel est le symbole chimique de l'or ?",
          options: ["Ag", "Au", "Fe", "Cu"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Au est le symbole de l'or dans le tableau périodique des éléments."
        },
        {
          question: "Combien de temps dure une année lumière ?",
          options: ["1 an", "10 ans", "La distance que la lumière parcourt en un an", "Cela varie"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Une année-lumière est une unité de distance, pas de temps, utilisée en astronomie."
        },
        {
          question: "Quel est le nom de la tour penchée de Pise ?",
          options: ["La Tour Eiffel", "La Tour de Pise", "La Tour de Londres", "La Tour de Babel"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Son nom est simplement la Tour de Pise, célèbre pour son inclinaison."
        },
        {
          question: "Quel est le plus grand océan du monde ?",
          options: ["Océan Atlantique", "Océan Indien", "Océan Arctique", "Océan Pacifique"],
          correctAnswer: 3,
          difficulty: "easy",
          explanation: "L'océan Pacifique est le plus grand et le plus profond des océans."
        },
        {
          question: "Quel est le plus petit pays du monde ?",
          options: ["Monaco", "Vatican", "Saint-Marin", "Nauru"],
          correctAnswer: 1,
          difficulty: "medium",
          explanation: "Le Vatican est le plus petit État souverain du monde, enclavé dans Rome."
        },
        {
          question: "Qui a dit 'Je pense, donc je suis' ?",
          options: ["Platon", "Aristote", "René Descartes", "Socrate"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "C'est une citation célèbre du philosophe français René Descartes."
        },
        {
          question: "Quel est le nom de la galaxie dans laquelle se trouve notre système solaire ?",
          options: ["Andromède", "Le Grand Nuage de Magellan", "La Voie lactée", "La Galaxie du Tourbillon"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Notre système solaire fait partie de la galaxie spirale barrée appelée la Voie lactée."
        },
        {
          question: "Quel est le plus grand désert chaud du monde ?",
          options: ["Désert de Gobi", "Désert d'Arabie", "Désert du Sahara", "Désert de Kalahari"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Le Sahara est le plus grand désert chaud de la planète."
        },
        {
          question: "Quel est le gaz le plus abondant dans l'atmosphère terrestre ?",
          options: ["Oxygène", "Dioxyde de carbone", "Azote", "Argon"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "L'azote compose environ 78% de l'atmosphère terrestre."
        },
        {
          question: "Combien de planètes composent notre système solaire ?",
          options: ["7", "8", "9", "10"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Notre système solaire compte huit planètes : Mercure, Vénus, Terre, Mars, Jupiter, Saturne, Uranus et Neptune."
        },
        {
          question: "Quel est le nom du plus grand océan sur Terre ?",
          options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
          correctAnswer: 3,
          difficulty: "easy",
          explanation: "L'océan Pacifique est le plus grand et le plus profond des cinq océans terrestres."
        }
      ],
      11: [ // Technologie et innovation
        {
          question: "Quelle entreprise a développé le système d'exploitation Android ?",
          options: ["Apple", "Microsoft", "Google", "Samsung"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Android est un système d'exploitation mobile développé par Google."
        },
        {
          question: "Qu'est-ce que la blockchain ?",
          options: ["Une cryptomonnaie", "Une base de données centralisée", "Une technologie de stockage et de transmission d'informations transparente et sécurisée", "Un type de réseau informatique"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "La blockchain est une technologie de registre distribué, utilisée notamment pour les cryptomonnaies."
        },
        {
          question: "Quel est le nom du premier navigateur web, créé par Tim Berners-Lee ?",
          options: ["Netscape Navigator", "Mosaic", "WorldWideWeb (Nexus)", "Internet Explorer"],
          correctAnswer: 2,
          difficulty: "hard",
          explanation: "WorldWideWeb, rebaptisé plus tard Nexus, a été le premier navigateur web développé."
        },
        {
          question: "Qu'est-ce que l'Internet des Objets (IoT) ?",
          options: ["Un réseau de serveurs", "La connexion d'objets physiques à Internet", "Un nouveau protocole Internet", "Un type de cyberattaque"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "L'IoT fait référence à l'interconnexion d'objets du quotidien avec Internet."
        },
        {
          question: "Quelle est la technologie derrière les voitures autonomes ?",
          options: ["L'intelligence artificielle", "Les moteurs à combustion", "La réalité augmentée", "Les imprimantes 3D"],
          correctAnswer: 0,
          difficulty: "medium",
          explanation: "L'intelligence artificielle, et plus spécifiquement le machine learning et la vision par ordinateur, est essentielle aux voitures autonomes."
        },
        {
          question: "Quel type d'énergie est produit par les panneaux solaires ?",
          options: ["Énergie éolienne", "Énergie nucléaire", "Énergie géothermique", "Énergie photovoltaïque"],
          correctAnswer: 3,
          difficulty: "easy",
          explanation: "Les panneaux solaires convertissent la lumière du soleil en électricité via l'effet photovoltaïque."
        },
        {
          question: "Qu'est-ce que la 5G ?",
          options: ["Une nouvelle génération de console de jeux", "La cinquième génération de technologie de communication mobile", "Un nouveau standard Wi-Fi", "Un type de satellite"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "La 5G offre des vitesses de connexion plus élevées et une latence réduite par rapport à la 4G."
        },
        {
          question: "Quel est le nom de l'entreprise qui a créé le premier iPhone ?",
          options: ["Samsung", "Microsoft", "Google", "Apple"],
          correctAnswer: 3,
          difficulty: "easy",
          explanation: "Apple a lancé le premier iPhone en 2007, révolutionnant l'industrie des smartphones."
        },
        {
          question: "Qu'est-ce qu'une cryptomonnaie ?",
          options: ["Une monnaie physique", "Une monnaie numérique décentralisée", "Un type de compte bancaire", "Une action boursière"],
          correctAnswer: 1,
          difficulty: "medium",
          explanation: "Une cryptomonnaie est une monnaie numérique qui utilise la cryptographie pour sécuriser les transactions et contrôler la création de nouvelles unités."
        },
        {
          question: "Quelle technologie est utilisée pour la réalité virtuelle (VR) ?",
          options: ["Écrans plats traditionnels", "Casques immersifs", "Projecteurs holographiques", "Écrans 3D sans lunettes"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "La réalité virtuelle utilise des casques pour immerger l'utilisateur dans un environnement simulé."
        }
      ],
      12: [ // Santé et bien-être
        {
          question: "Quel est l'organe le plus grand du corps humain ?",
          options: ["Le foie", "Le cerveau", "La peau", "Les poumons"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "La peau est l'organe le plus grand et le plus lourd du corps humain."
        },
        {
          question: "Quelle vitamine est essentielle pour la coagulation sanguine ?",
          options: ["Vitamine C", "Vitamine D", "Vitamine K", "Vitamine B12"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "La vitamine K joue un rôle crucial dans la synthèse des protéines nécessaires à la coagulation."
        },
        {
          question: "Combien de temps faut-il en moyenne pour qu'un adulte digère un repas ?",
          options: ["1 à 2 heures", "3 à 5 heures", "6 à 8 heures", "Plus de 10 heures"],
          correctAnswer: 1,
          difficulty: "medium",
          explanation: "Le temps de digestion varie, mais en général, un repas prend 3 à 5 heures pour traverser l'estomac et l'intestin grêle."
        },
        {
          question: "Quel est le principal bienfait de l'exercice régulier sur la santé mentale ?",
          options: ["Augmentation de l'appétit", "Amélioration du sommeil et réduction du stress", "Diminution de la concentration", "Augmentation de l'agressivité"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "L'exercice libère des endorphines, qui ont un effet positif sur l'humeur et le sommeil."
        },
        {
          question: "Quel type de régime alimentaire exclut tous les produits d'origine animale ?",
          options: ["Végétarien", "Pesco-végétarien", "Végan", "Flexitarien"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Le régime végétalien (végan) exclut la viande, le poisson, les produits laitiers, les œufs et le miel."
        },
        {
          question: "Combien de litres de sang un adulte moyen a-t-il dans son corps ?",
          options: ["1-2 litres", "3-4 litres", "5-6 litres", "7-8 litres"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Un adulte moyen possède environ 5 à 6 litres de sang, soit environ 7% de son poids corporel."
        },
        {
          question: "Quel est le nom du processus par lequel le corps décompose les aliments pour en extraire l'énergie ?",
          options: ["Absorption", "Circulation", "Métabolisme", "Excrétion"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "Le métabolisme englobe l'ensemble des réactions chimiques qui se produisent dans les cellules de l'organisme."
        },
        {
          question: "Quel est le nom de l'hormone du sommeil ?",
          options: ["Adrénaline", "Insuline", "Mélatonine", "Cortisol"],
          correctAnswer: 2,
          difficulty: "easy",
          explanation: "La mélatonine est une hormone produite par le corps qui aide à réguler les cycles veille-sommeil."
        },
        {
          question: "Quel est le nombre de repas recommandés par jour pour une alimentation équilibrée ?",
          options: ["2", "3", "4-5", "1"],
          correctAnswer: 1,
          difficulty: "easy",
          explanation: "Trois repas principaux (petit-déjeuner, déjeuner, dîner) sont généralement recommandés, avec des collations si nécessaire."
        },
        {
          question: "Quel est l'impact principal du stress chronique sur le corps ?",
          options: ["Amélioration de la digestion", "Renforcement du système immunitaire", "Augmentation de la tension artérielle et fatigue", "Diminution du rythme cardiaque"],
          correctAnswer: 2,
          difficulty: "medium",
          explanation: "Le stress chronique peut entraîner une augmentation de la tension artérielle, de la fatigue, des troubles du sommeil et un affaiblissement du système immunitaire."
        }
      ]
    };

    // Add questions for the first 6 themes (detailed above)
    for (const [themeId, questionsArray] of Object.entries(questionsData)) {
      // Cast questionsArray to an array of RawQuestionData to hint TypeScript
      for (const rawQuestionData of questionsArray as RawQuestionData[]) { 
        const question: Question = {
          id: this.currentQuestionId++,
          themeId: parseInt(themeId),
          question: rawQuestionData.question,
          options: rawQuestionData.options,
          correctAnswer: rawQuestionData.correctAnswer,
          // Correction pour s'assurer que 'difficulty' est toujours une string valide
          difficulty: rawQuestionData.difficulty ?? 'medium', 
          // Utilise l'opérateur de coalescence nullish pour garantir string | null
          explanation: rawQuestionData.explanation ?? null 
        };
        this.questions.set(question.id, question);
      }
    }

    // All themes now have specific questions, so the generic loop is removed.
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
      role: insertUser.role ?? 'user'
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
      isActive: insertTheme.isActive ?? true
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
      difficulty: insertQuestion.difficulty ?? 'medium',
      explanation: insertQuestion.explanation ?? null // Utiliser ?? null pour garantir string | null
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
        bestScore: session.score,
        averageScore: session.score,
        totalTimeSpent: session.timeSpent,
      });
    }
  }

  // Leaderboard operations
  async getGlobalLeaderboard(): Promise<Array<User & { totalScore: number }>> {
    const usersWithScores: Array<User & { totalScore: number }> = [];
    // Correction de l'itération pour la compatibilité TypeScript
    for (const user of Array.from(this.users.values())) {
      const userSessions = Array.from(this.quizSessions.values()).filter(s => s.userId === user.id);
      const totalScore = userSessions.reduce((sum, session) => sum + session.score, 0);
      usersWithScores.push({ ...user, totalScore });
    }
    return usersWithScores.sort((a, b) => b.totalScore - a.totalScore);
  }

  async getThemeLeaderboard(themeId: number): Promise<Array<User & { bestScore: number }>> {
    const themeUsersBestScores: Map<number, { user: User, bestScore: number }> = new Map();

    // Correction de l'itération pour la compatibilité TypeScript
    for (const session of Array.from(this.quizSessions.values())) {
      if (session.themeId === themeId) {
        const user = this.users.get(session.userId);
        if (user) {
          const currentBest = themeUsersBestScores.get(user.id);
          if (!currentBest || session.score > currentBest.bestScore) {
            themeUsersBestScores.set(user.id, { user, bestScore: session.score });
          }
        }
      }
    }
    return Array.from(themeUsersBestScores.values())
      .map(data => ({ ...data.user, bestScore: data.bestScore }))
      .sort((a, b) => b.bestScore - a.bestScore);
  }
}
