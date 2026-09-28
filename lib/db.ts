import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { seedIfNeeded } from "@/lib/seed";

type SqlValue = string | number | bigint | null;

function resolveDataDir() {
  if (process.env.YRA3_DATA_DIR) return process.env.YRA3_DATA_DIR;
  const local = path.join(process.cwd(), "data");
  try {
    fs.mkdirSync(path.join(local, "uploads"), { recursive: true });
    fs.accessSync(local, fs.constants.W_OK);
    return local;
  } catch {
    const temporary = path.join("/tmp", "yra3");
    fs.mkdirSync(path.join(temporary, "uploads"), { recursive: true });
    return temporary;
  }
}

let database: DatabaseSync | null = null;
let ready = false;
let seeding = false;

function openDatabase() {
  const directory = resolveDataDir();
  fs.mkdirSync(path.join(directory, "uploads"), { recursive: true });
  const db = new DatabaseSync(path.join(directory, "yra3.sqlite"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  return db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      alt TEXT NOT NULL DEFAULT '',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name_norm TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      image_id TEXT REFERENCES media(id) ON DELETE SET NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name_norm TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image_id TEXT REFERENCES media(id) ON DELETE SET NULL,
      icon TEXT NOT NULL DEFAULT 'feather',
      color TEXT NOT NULL DEFAULT 'lavender',
      sort_order INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      show_on_home INTEGER NOT NULL DEFAULT 1,
      show_in_nav INTEGER NOT NULL DEFAULT 1,
      featured INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title_norm TEXT NOT NULL DEFAULT '',
      short_description TEXT NOT NULL DEFAULT '',
      short_norm TEXT NOT NULL DEFAULT '',
      full_description TEXT NOT NULL DEFAULT '',
      author_id TEXT REFERENCES authors(id) ON DELETE SET NULL,
      cover_id TEXT REFERENCES media(id) ON DELETE SET NULL,
      primary_category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      age_range TEXT NOT NULL DEFAULT '',
      story_type TEXT NOT NULL DEFAULT '',
      genre TEXT NOT NULL DEFAULT '',
      genre_norm TEXT NOT NULL DEFAULT '',
      reading_minutes INTEGER,
      featured INTEGER NOT NULL DEFAULT 0,
      editor_pick INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0,
      publish_at TEXT,
      popularity INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      favorite_count INTEGER NOT NULL DEFAULT 0,
      admin_notes TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL DEFAULT 0,
      narrator TEXT NOT NULL DEFAULT '',
      series_name TEXT NOT NULL DEFAULT '',
      episode_number TEXT NOT NULL DEFAULT '',
      external_source TEXT NOT NULL DEFAULT '',
      audio_url TEXT NOT NULL DEFAULT '',
      video_url TEXT NOT NULL DEFAULT '',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS story_categories (
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (story_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name_norm TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS story_tags (
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (story_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS story_relations (
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      related_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      PRIMARY KEY (story_id, related_id)
    );

    CREATE TABLE IF NOT EXISTS story_gallery (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS homepage_sections (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'auto',
      item_count INTEGER NOT NULL DEFAULT 8,
      layout TEXT NOT NULL DEFAULT 'grid',
      config TEXT NOT NULL DEFAULT '{}',
      starts_at TEXT,
      ends_at TEXT
    );

    CREATE TABLE IF NOT EXISTS section_items (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES homepage_sections(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      pinned INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, story_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stories_pub ON stories(published, publish_at);
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
}

export function getDb() {
  if (!database) {
    database = openDatabase();
    migrate(database);
  }
  if (!ready && !seeding) {
    seeding = true;
    try {
      seedIfNeeded();
      ready = true;
    } finally {
      seeding = false;
    }
  }
  return database;
}

function bind(params: Array<string | number | bigint | null | undefined>): SqlValue[] {
  return params.map((value) => (value === undefined ? null : value));
}

export function all<T extends Record<string, unknown>>(sql: string, ...params: Array<string | number | bigint | null | undefined>) {
  const rows = getDb().prepare(sql).all(...bind(params));
  return rows.map((row) => ({ ...row }) as T);
}

export function one<T extends Record<string, unknown>>(sql: string, ...params: Array<string | number | bigint | null | undefined>) {
  const row = getDb().prepare(sql).get(...bind(params));
  return row ? ({ ...row } as T) : null;
}

export function run(sql: string, ...params: Array<string | number | bigint | null | undefined>) {
  return getDb().prepare(sql).run(...bind(params));
}

export function transaction(fn: () => void) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    fn();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function uploadsDir() {
  return path.join(resolveDataDir(), "uploads");
}
