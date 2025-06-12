import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite"; // Nous n'avons besoin que de 'log' ici, 'setupVite' et 'serveStatic' sont supprimés car le backend ne gère pas le frontend sur Render.

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // `registerRoutes` est appelé ici. Il est supposé configurer 'app' et peut-être retourner une instance de serveur HTTP si nécessaire.
  // En général avec Express, `app.listen` est suffisant.
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // --- Modifications clés ici ---

  // Supprimez tout le bloc conditionnel 'if (app.get("env") === "development") { ... } else { ... }'
  // car le backend ne doit plus servir le frontend ni gérer Vite en production sur Render.

  // Convertit la variable d'environnement PORT en nombre, ou utilise 5000 par défaut.
  const port = parseInt(process.env.PORT || '5000', 10);
  // Écoute sur toutes les interfaces réseau pour être accessible par Render.
  const hostname = '0.0.0.0';

  // Le serveur Express écoute directement sur le port et le hostname spécifiés.
  app.listen(port, hostname, () => {
    log(`serving on port ${port}`);
  });

  // --- Fin des modifications clés ---

})();