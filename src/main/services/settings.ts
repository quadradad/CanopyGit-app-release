import { createCipheriv, createDecipheriv, randomBytes, randomUUID, createHash } from 'crypto';
import { hostname, userInfo } from 'os';
import type { AppSettings, TokenStatus } from '../../shared/types';
import type { DatabaseService } from './database';

const DEFAULT_SETTINGS: AppSettings = {
  stalenessThresholdDays: 30,
  lastRepoId: null,
  autoRefreshOnFocus: true,
  refreshCooldownSeconds: 60,
  showStaleWarnings: true,
  showBranchPathInFull: false,
  showCommitCountBadges: true,
  branchNameFontSize: 'md',
};

const SETTINGS_KEY = 'app_settings';
const TOKEN_KEY = 'github_token_encrypted';
const MACHINE_ID_KEY = 'encryption_machine_id';
const MIGRATION_FLAG_KEY = 'key_migration_v1';
const ALGORITHM = 'aes-256-gcm';

function deriveKeyFromMaterial(material: string): Buffer {
  return createHash('sha256').update(material).digest();
}

/** Legacy key derivation — only used for migrating existing tokens. */
function deriveLegacyKey(): Buffer {
  return deriveKeyFromMaterial(`${hostname()}-${userInfo().username}-canopy-token-key`);
}

function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store as: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(stored: string, key: Buffer): string {
  const [ivB64, tagB64, dataB64] = stored.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export class SettingsService {
  private databaseService: DatabaseService;
  private encryptionKey!: Buffer;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Must be called after construction. Initializes the stable encryption key
   * and migrates any tokens encrypted with the old hostname-based key.
   */
  initializeEncryption(): void {
    const machineId = this.getOrCreateMachineId();
    this.encryptionKey = deriveKeyFromMaterial(`${machineId}-canopy-token-key`);
    this.migrateTokenEncryption();
  }

  private getOrCreateMachineId(): string {
    const row = this.databaseService.getDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(MACHINE_ID_KEY) as { value: string } | undefined;

    if (row) return row.value;

    const id = randomUUID();
    this.databaseService.getDb()
      .prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
      .run(MACHINE_ID_KEY, id);
    return id;
  }

  private migrateTokenEncryption(): void {
    const flag = this.databaseService.getDb()
      .prepare('SELECT 1 FROM settings WHERE key = ?')
      .get(MIGRATION_FLAG_KEY);
    if (flag) return;

    // Mark migration as done (before attempting, so it's idempotent)
    this.databaseService.getDb()
      .prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
      .run(MIGRATION_FLAG_KEY, 'done');

    const row = this.databaseService.getDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(TOKEN_KEY) as { value: string } | undefined;
    if (!row) return;

    try {
      const legacyKey = deriveLegacyKey();
      const plaintext = decrypt(row.value, legacyKey);
      const reEncrypted = encrypt(plaintext, this.encryptionKey);
      this.databaseService.getDb()
        .prepare('UPDATE settings SET value = ? WHERE key = ?')
        .run(reEncrypted, TOKEN_KEY);
      console.log('GitHub token migrated to stable encryption key');
    } catch {
      console.warn('Could not migrate GitHub token — old encryption key no longer valid. Token will need to be re-entered.');
      this.databaseService.getDb()
        .prepare('DELETE FROM settings WHERE key = ?')
        .run(TOKEN_KEY);
    }
  }

  getSettings(): AppSettings {
    const row = this.databaseService.getDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(SETTINGS_KEY) as { value: string } | undefined;

    if (!row) return { ...DEFAULT_SETTINGS };

    const stored = JSON.parse(row.value) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  saveSettings(partial: Partial<AppSettings>): void {
    const current = this.getSettings();
    const merged = { ...current, ...partial };
    this.databaseService.getDb()
      .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run(SETTINGS_KEY, JSON.stringify(merged));
  }

  saveGitHubToken(token: string): void {
    const encrypted = encrypt(token, this.encryptionKey);
    this.databaseService.getDb()
      .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run(TOKEN_KEY, encrypted);
  }

  getGitHubToken(): string | null {
    // Environment variable takes precedence
    const envToken = process.env.GITHUB_TOKEN;
    if (envToken) return envToken;

    const row = this.databaseService.getDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(TOKEN_KEY) as { value: string } | undefined;

    if (!row) return null;

    try {
      return decrypt(row.value, this.encryptionKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`GitHub token exists but could not be decrypted — token will need to be re-entered (${message})`);
      return null;
    }
  }

  clearGitHubToken(): void {
    this.databaseService.getDb()
      .prepare('DELETE FROM settings WHERE key = ?')
      .run(TOKEN_KEY);
  }

  hasGitHubToken(): TokenStatus {
    if (process.env.GITHUB_TOKEN) return 'valid';

    const row = this.databaseService.getDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(TOKEN_KEY) as { value: string } | undefined;

    if (!row) return 'none';

    try {
      decrypt(row.value, this.encryptionKey);
      return 'valid';
    } catch {
      return 'corrupted';
    }
  }

  clearAll(): void {
    try {
      this.databaseService.getDb()
        .prepare('DELETE FROM settings')
        .run();
    } catch {
      // Database may already be closed (e.g., after reset) — ignore
    }
  }
}
