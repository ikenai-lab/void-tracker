/**
 * Database Connection & Initialization
 * 
 * Sets up expo-sqlite with Drizzle ORM for the Void Tracker.
 * Handles table creation and provides the database instance.
 * 
 * NOTE: expo-sqlite doesn't support web. On web, we use an in-memory mock.
 */

import { Platform } from 'react-native';
import * as schema from './schema';

// Platform detection
const isWeb = Platform.OS === 'web';

// Database types
type DrizzleDB = ReturnType<typeof import('drizzle-orm/expo-sqlite').drizzle>;

// Lazy-loaded database components
let _db: DrizzleDB | null = null;
let _expoDb: any | null = null;

/**
 * Get the Drizzle database instance
 * Only works on native platforms (iOS/Android)
 */
export function getDb(): DrizzleDB {
  if (isWeb) {
    throw new Error('SQLite is not supported on web. Use the mock store instead.');
  }

  if (!_db) {
    const { drizzle } = require('drizzle-orm/expo-sqlite');
    const { openDatabaseSync } = require('expo-sqlite');

    if (!_expoDb) {
      _expoDb = openDatabaseSync('void-tracker.db');
    }
    _db = drizzle(_expoDb, { schema });
  }

  return _db!;
}

// Alias for backward compatibility
export const db = isWeb ? null : getDb;

/**
 * Initialize the database tables
 * 
 * Creates the habits and logs tables if they don't exist.
 * Should be called once when the app starts.
 */
export async function initializeDatabase(): Promise<void> {
  if (isWeb) {
    console.log('[DB] Running on web - using mock data store');
    return;
  }

  try {
    const { openDatabaseSync } = require('expo-sqlite');
    const expoDb = _expoDb || (() => {
      _expoDb = openDatabaseSync('void-tracker.db');
      return _expoDb!;
    })();

    // Create habits table
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        icon_key TEXT NOT NULL DEFAULT 'circle',
        reminder_time TEXT,
        color TEXT NOT NULL DEFAULT '#ffb347',
        archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Migration: Add new columns if they don't exist (safe update)
    try {
      expoDb.execSync(`ALTER TABLE habits ADD COLUMN reminder_time TEXT;`);
      console.log('[DB] Added reminder_time column');
    } catch (e) {
      // Column likely already exists, ignore
    }

    try {
      expoDb.execSync(`ALTER TABLE habits ADD COLUMN color TEXT NOT NULL DEFAULT '#ffb347';`);
      console.log('[DB] Added color column');
    } catch (e) {
      // Column likely already exists, ignore
    }

    try {
      expoDb.execSync(`ALTER TABLE habits ADD COLUMN type TEXT NOT NULL DEFAULT 'positive';`);
      console.log('[DB] Added type column');
    } catch (e) {
      // Column likely already exists, ignore
    }

    // Create logs table with foreign key
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY NOT NULL,
        habit_id TEXT NOT NULL,
        date_key TEXT NOT NULL,
        completed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    expoDb.execSync(`CREATE INDEX IF NOT EXISTS idx_logs_date_key ON logs(date_key);`);
    expoDb.execSync(`CREATE INDEX IF NOT EXISTS idx_logs_habit_id ON logs(habit_id);`);
    expoDb.execSync(`CREATE INDEX IF NOT EXISTS idx_logs_habit_date ON logs(habit_id, date_key);`);

    console.log('[DB] Database initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Check if we're running on a platform with SQLite support
 */
export function hasSQLiteSupport(): boolean {
  return !isWeb;
}

/**
 * Generate a UUID v4
 * Simple implementation for creating unique IDs
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get today's date key in YYYY-MM-DD format
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Re-export schema for convenience
export * from './schema';
