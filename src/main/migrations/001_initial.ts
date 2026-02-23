import type BetterSqlite3 from 'better-sqlite3';

export const name = '001_initial';

export function up(db: BetterSqlite3.Database): void {
  db.exec(`
    -- Enable WAL mode for performance
    PRAGMA journal_mode = WAL;

    -- repos
    CREATE TABLE repos (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      path          TEXT    NOT NULL UNIQUE,
      display_name  TEXT    NOT NULL,
      last_opened   TEXT    NOT NULL DEFAULT (datetime('now')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_repos_last_opened ON repos(last_opened DESC);

    -- branches
    CREATE TABLE branches (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id                  INTEGER NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
      branch_name              TEXT    NOT NULL,
      status                   TEXT    NOT NULL DEFAULT 'active'
                               CHECK (status IN (
                                 'active',
                                 'waiting_on_pr',
                                 'waiting_on_person',
                                 'blocked_by_issue',
                                 'ready_to_merge',
                                 'stale',
                                 'abandoned'
                               )),
      blocker_type             TEXT    CHECK (blocker_type IN ('pr', 'person', 'issue') OR blocker_type IS NULL),
      blocker_ref              TEXT,
      next_step                TEXT    DEFAULT '',
      notes                    TEXT    DEFAULT '',
      manually_set_parent      TEXT,
      last_seen                TEXT    NOT NULL DEFAULT (datetime('now')),
      hidden                   INTEGER NOT NULL DEFAULT 0,
      created_at               TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at               TEXT    NOT NULL DEFAULT (datetime('now')),

      UNIQUE(repo_id, branch_name)
    );

    CREATE INDEX idx_branches_repo    ON branches(repo_id);
    CREATE INDEX idx_branches_status  ON branches(repo_id, status);
    CREATE INDEX idx_branches_hidden  ON branches(repo_id, hidden);

    -- pr_cache
    CREATE TABLE pr_cache (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id      INTEGER NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
      pr_number    INTEGER NOT NULL,
      branch_name  TEXT    NOT NULL,
      title        TEXT    NOT NULL DEFAULT '',
      state        TEXT    NOT NULL DEFAULT 'open'
                   CHECK (state IN ('open', 'closed', 'merged', 'draft')),
      review_state TEXT    CHECK (review_state IN (
                             'pending', 'changes_requested', 'approved'
                           ) OR review_state IS NULL),
      checks_state TEXT    CHECK (checks_state IN (
                             'pending', 'success', 'failure'
                           ) OR checks_state IS NULL),
      comment_count INTEGER NOT NULL DEFAULT 0,
      html_url     TEXT    NOT NULL DEFAULT '',
      fetched_at   TEXT    NOT NULL DEFAULT (datetime('now')),

      UNIQUE(repo_id, pr_number)
    );

    CREATE INDEX idx_pr_cache_branch ON pr_cache(repo_id, branch_name);
  `);
}
