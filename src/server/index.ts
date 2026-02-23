import path from 'path';
import express from 'express';
import { DatabaseService } from '../main/services/database';
import { SettingsService } from '../main/services/settings';
import { GitService } from '../main/services/git';
import { GitHubService } from '../main/services/github';
import { RefreshService } from '../main/services/refresh';
import { createMiddleware } from './middleware';
import { registerRoutes } from './routes';

const PORT = parseInt(process.env.CANOPY_PORT || '3777', 10);

const app = express();

// ── Middleware ──
createMiddleware(app);

// ── Static Files ──
// Serve the Vite-built renderer from dist/renderer/
const staticPath = path.join(__dirname, '../renderer');
app.use(express.static(staticPath));

// ── Initialize Services ──
const dbPath = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  'Library/Application Support/Canopy/canopy.db',
);
const databaseService = new DatabaseService(dbPath);
databaseService.initialize();

const settingsService = new SettingsService(databaseService);
settingsService.initializeEncryption();
const gitService = new GitService();

const githubService = new GitHubService(settingsService);
githubService.initialize();

const refreshService = new RefreshService(gitService, databaseService, githubService);

// ── Register Routes ──
registerRoutes(app, {
  gitService,
  githubService,
  databaseService,
  settingsService,
  refreshService,
});

// ── SPA Fallback ──
// All non-API routes serve index.html for client-side routing
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`Canopy server running on http://localhost:${PORT}`);
});

// ── Graceful Shutdown ──
process.on('SIGINT', () => {
  databaseService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  databaseService.close();
  process.exit(0);
});
