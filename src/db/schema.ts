/**
 * Void Tracker Database Schema
 * 
 * Local-first habit tracking with Drizzle ORM and expo-sqlite.
 * Two core tables: habits (what to track) and logs (when completed).
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Habits Table
 * 
 * Stores the user's trackable habits/activities.
 * Each habit has an icon key that maps to a lucide icon.
 */
export const habits = sqliteTable('habits', {
    // Unique identifier (UUID)
    id: text('id').primaryKey(),

    // Display title of the habit
    title: text('title').notNull(),

    // Icon key for lucide-react-native (e.g., 'book', 'gym', 'code')
    iconKey: text('icon_key').notNull().default('circle'),

    // Reminder time (HH:MM format, nullable)
    reminderTime: text('reminder_time'),

    // Accent color for the habit (hex code)
    color: text('color').notNull().default('#ffb347'),

    // Habit type: 'positive' (build) or 'negative' (break)
    type: text('type').notNull().default('positive'),

    // Whether the habit is archived (hidden from active view)
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),

    // Creation timestamp
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
});

/**
 * Logs Table
 * 
 * Records each completion of a habit.
 * The date_key format "YYYY-MM-DD" enables efficient date-based queries.
 */
export const logs = sqliteTable('logs', {
    // Unique identifier (UUID)
    id: text('id').primaryKey(),

    // Reference to the habit being logged
    habitId: text('habit_id')
        .notNull()
        .references(() => habits.id, { onDelete: 'cascade' }),

    // Date string in "YYYY-MM-DD" format for easy querying
    // This is the PRIMARY query dimension - "what did I complete today?"
    dateKey: text('date_key').notNull(),

    // Exact timestamp when the habit was marked complete
    completedAt: integer('completed_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
});

// Type exports for use in components and stores
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;

// Habit with today's completion status (joined result)
export type HabitWithStatus = Habit & {
    isCompletedToday: boolean;
    todayLogId: string | null;
};
