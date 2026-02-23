import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import fs from 'fs';
import { runMigrations } from '../migrations/index';
import type {
  Repo,
  BranchRecord,
  BranchFields,
  PRCacheEntry,
  BranchStatus,
  BlockerType,
  PRState,
  ReviewState,
  ChecksState,
} from '../../shared/types';

interface RepoRow {
  id: number;
  path: string;
  display_name: string;
  last_opened: string;
  created_at: string;
}

interface BranchRow {
  id: number;
  repo_id: number;
  branch_name: string;
  status: string;
  blocker_type: string | null;
  blocker_ref: string | null;
  next_step: string;
  notes: string;
  manually_set_parent: string | null;
  last_seen: string;
  hidden: number;
  created_at: string;
  updated_at: string;
}

interface PRCacheRow {
  id: number;
  repo_id: number;
  pr_number: number;
  branch_name: string;
  title: string;
  state: string;
  review_state: string | null;
  checks_state: string | null;
  comment_count: number;
  html_url: string;
  fetched_at: string;
}

function mapRepoRow(row: RepoRow): Repo {
  return {
    id: row.id,
    path: row.path,
    displayName: row.display_name,
    lastOpened: row.last_opened,
    createdAt: row.created_at,
  };
}

function mapBranchRow(row: BranchRow): BranchRecord {
  return {
    id: row.id,
    repoId: row.repo_id,
    branchName: row.branch_name,
    status: row.status as BranchStatus,
    blockerType: row.blocker_type as BlockerType | null,
    blockerRef: row.blocker_ref,
    nextStep: row.next_step,
    notes: row.notes,
    manuallySetParent: row.manually_set_parent,
    lastSeen: row.last_seen,
    hidden: row.hidden === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPRCacheRow(row: PRCacheRow): PRCacheEntry {
  return {
    prNumber: row.pr_number,
    branchName: row.branch_name,
    title: row.title,
    state: row.state as PRState,
    reviewState: row.review_state as ReviewState | null,
    checksState: row.checks_state as ChecksState | null,
    commentCount: row.comment_count,
    htmlUrl: row.html_url,
    fetchedAt: row.fetched_at,
  };
}

export class DatabaseService {
  private db: BetterSqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  initialize(): void {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    runMigrations(this.db);
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }

  reset(): void {
    this.close();
    if (this.dbPath !== ':memory:' && fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
      // Also remove WAL and SHM files if they exist
      const walPath = this.dbPath + '-wal';
      const shmPath = this.dbPath + '-shm';
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    }
  }

  /** Returns the raw database handle. Used by SettingsService for settings table access. */
  getDb(): BetterSqlite3.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // ── Repos ──

  getRepos(): Repo[] {
    const rows = this.getDb()
      .prepare('SELECT * FROM repos ORDER BY last_opened DESC')
      .all() as RepoRow[];
    return rows.map(mapRepoRow);
  }

  addRepo(path: string, displayName: string): Repo {
    const db = this.getDb();
    // Insert or ignore if path already exists
    db.prepare(
      'INSERT OR IGNORE INTO repos (path, display_name) VALUES (?, ?)'
    ).run(path, displayName);
    // Update last_opened regardless
    db.prepare(
      "UPDATE repos SET last_opened = datetime('now') WHERE path = ?"
    ).run(path);
    const row = db
      .prepare('SELECT * FROM repos WHERE path = ?')
      .get(path) as RepoRow;
    return mapRepoRow(row);
  }

  removeRepo(repoId: number): void {
    this.getDb().prepare('DELETE FROM repos WHERE id = ?').run(repoId);
  }

  updateRepoOpened(repoId: number): void {
    this.getDb()
      .prepare("UPDATE repos SET last_opened = datetime('now') WHERE id = ?")
      .run(repoId);
  }

  updateRepoDisplayName(repoId: number, displayName: string): void {
    this.getDb()
      .prepare('UPDATE repos SET display_name = ? WHERE id = ?')
      .run(displayName, repoId);
  }

  // ── Branches ──

  getBranch(repoId: number, branchName: string): BranchRecord | null {
    const row = this.getDb()
      .prepare(
        'SELECT * FROM branches WHERE repo_id = ? AND branch_name = ? AND hidden = 0'
      )
      .get(repoId, branchName) as BranchRow | undefined;
    return row ? mapBranchRow(row) : null;
  }

  getBranches(repoId: number): BranchRecord[] {
    const rows = this.getDb()
      .prepare('SELECT * FROM branches WHERE repo_id = ? AND hidden = 0')
      .all(repoId) as BranchRow[];
    return rows.map(mapBranchRow);
  }

  getAllBranches(repoId: number): BranchRecord[] {
    const rows = this.getDb()
      .prepare('SELECT * FROM branches WHERE repo_id = ?')
      .all(repoId) as BranchRow[];
    return rows.map(mapBranchRow);
  }

  upsertBranch(
    repoId: number,
    branchName: string,
    fields: Partial<BranchFields>
  ): BranchRecord {
    const db = this.getDb();

    // Build SET clause dynamically from provided fields
    const columnMap: Record<string, string> = {
      status: 'status',
      blockerType: 'blocker_type',
      blockerRef: 'blocker_ref',
      nextStep: 'next_step',
      notes: 'notes',
      manuallySetParent: 'manually_set_parent',
    };

    const setClauses: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];

    for (const [field, column] of Object.entries(columnMap)) {
      if (field in fields) {
        setClauses.push(`${column} = ?`);
        values.push(fields[field as keyof BranchFields] ?? null);
      }
    }

    // Try to insert first
    db.prepare(
      'INSERT OR IGNORE INTO branches (repo_id, branch_name) VALUES (?, ?)'
    ).run(repoId, branchName);

    // Then update with provided fields
    if (setClauses.length > 0) {
      const sql = `UPDATE branches SET ${setClauses.join(', ')} WHERE repo_id = ? AND branch_name = ?`;
      db.prepare(sql).run(...values, repoId, branchName);
    }

    return this.getBranchIncludingHidden(repoId, branchName)!;
  }

  private getBranchIncludingHidden(
    repoId: number,
    branchName: string
  ): BranchRecord | null {
    const row = this.getDb()
      .prepare(
        'SELECT * FROM branches WHERE repo_id = ? AND branch_name = ?'
      )
      .get(repoId, branchName) as BranchRow | undefined;
    return row ? mapBranchRow(row) : null;
  }

  setBranchHidden(
    repoId: number,
    branchName: string,
    hidden: boolean
  ): void {
    this.getDb()
      .prepare(
        'UPDATE branches SET hidden = ? WHERE repo_id = ? AND branch_name = ?'
      )
      .run(hidden ? 1 : 0, repoId, branchName);
  }

  updateBranchLastSeen(repoId: number, branchNames: string[]): void {
    const db = this.getDb();
    const stmt = db.prepare(
      "UPDATE branches SET last_seen = datetime('now') WHERE repo_id = ? AND branch_name = ?"
    );
    const updateAll = db.transaction(() => {
      for (const name of branchNames) {
        stmt.run(repoId, name);
      }
    });
    updateAll();
  }

  // ── PR Cache ──

  getCachedPR(repoId: number, branchName: string): PRCacheEntry | null {
    const row = this.getDb()
      .prepare(
        'SELECT * FROM pr_cache WHERE repo_id = ? AND branch_name = ?'
      )
      .get(repoId, branchName) as PRCacheRow | undefined;
    return row ? mapPRCacheRow(row) : null;
  }

  upsertPRCache(repoId: number, entry: PRCacheEntry): void {
    this.getDb()
      .prepare(
        `INSERT INTO pr_cache (repo_id, pr_number, branch_name, title, state, review_state, checks_state, comment_count, html_url, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(repo_id, pr_number) DO UPDATE SET
           branch_name = excluded.branch_name,
           title = excluded.title,
           state = excluded.state,
           review_state = excluded.review_state,
           checks_state = excluded.checks_state,
           comment_count = excluded.comment_count,
           html_url = excluded.html_url,
           fetched_at = excluded.fetched_at`
      )
      .run(
        repoId,
        entry.prNumber,
        entry.branchName,
        entry.title,
        entry.state,
        entry.reviewState,
        entry.checksState,
        entry.commentCount,
        entry.htmlUrl,
        entry.fetchedAt
      );
  }
}
