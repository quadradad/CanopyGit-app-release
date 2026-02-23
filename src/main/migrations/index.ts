import type BetterSqlite3 from 'better-sqlite3';
import * as migration001 from './001_initial';
import * as migration002 from './002_settings';

interface Migration {
  name: string;
  up: (db: BetterSqlite3.Database) => void;
}

const migrations: Migration[] = [migration001, migration002];

export function runMigrations(db: BetterSqlite3.Database): void {
  // Ensure the _migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Get already-applied migrations
  const applied = new Set(
    db
      .prepare('SELECT name FROM _migrations')
      .all()
      .map((row) => (row as { name: string }).name)
  );

  // Apply pending migrations in a transaction
  const applyMigration = db.transaction((migration: Migration) => {
    migration.up(db);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
  });

  for (const migration of migrations) {
    if (!applied.has(migration.name)) {
      applyMigration(migration);
    }
  }
}
