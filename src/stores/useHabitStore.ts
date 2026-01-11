/**
 * Habit Store - Zustand State Management
 * 
 * Interfaces with the local SQLite database to manage habits and logs.
 * On web, uses in-memory storage for testing.
 * On native, uses expo-sqlite with Drizzle ORM.
 */

import { Platform } from 'react-native';
import { create } from 'zustand';
import {
    generateId,
    getTodayDateKey,
    hasSQLiteSupport,
    type HabitWithStatus,
} from '../db';

const isWeb = Platform.OS === 'web';

interface HabitStore {
    // State
    habits: HabitWithStatus[];
    isLoading: boolean;
    error: string | null;

    // In-memory storage for web
    _webHabits: Array<{
        id: string;
        title: string;
        iconKey: string;
        color: string;
        type: string;
        reminderTime: string | null;
        archived: boolean;
        createdAt: Date;
    }>;
    _webLogs: Array<{
        id: string;
        habitId: string;
        dateKey: string;
        completedAt: Date;
    }>;

    // Actions
    loadHabits: () => Promise<void>;
    toggleHabit: (habitId: string, dateKey?: string) => Promise<void>;
    addHabit: (title: string, iconKey?: string, color?: string, reminderTime?: string, type?: 'positive' | 'negative') => Promise<void>;
    archiveHabit: (habitId: string) => Promise<void>;
    deleteHabit: (habitId: string) => Promise<void>;

    // Data Fetchers
    getHabitsWithSparkline: () => Promise<Array<HabitWithStatus & { sparkline: boolean[], color: string }>>;
    getHabitDetails: (habitId: string) => Promise<{
        logs: any[];
        currentStreak: number;
        consistencyScore: number;
        totalCompletions: number;
    }>;

    // Reactivity
    version: number;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
    // Initial state
    habits: [],
    isLoading: true,
    error: null,

    // Internal data
    _webHabits: [],
    _webLogs: [],

    version: 0,

    /**
     * Load all active habits with today's completion status
     */
    loadHabits: async () => {
        set({ isLoading: true, error: null });

        try {
            const todayKey = getTodayDateKey();

            if (isWeb) {
                // Web: Use in-memory storage
                const { _webHabits, _webLogs } = get();

                const habitsWithStatus: HabitWithStatus[] = _webHabits
                    .filter(h => !h.archived)
                    .map(habit => {
                        const todayLog = _webLogs.find(
                            log => log.habitId === habit.id && log.dateKey === todayKey
                        );
                        return {
                            ...habit,
                            isCompletedToday: !!todayLog,
                            todayLogId: todayLog?.id ?? null,
                        };
                    });

                set({ habits: habitsWithStatus, isLoading: false });
            } else {
                // Native: Use SQLite
                const { getDb } = require('../db');
                const { eq } = require('drizzle-orm');
                const { habits, logs } = require('../db/schema');

                const db = getDb();

                const allHabits = await db
                    .select()
                    .from(habits)
                    .where(eq(habits.archived, false));

                const todayLogs = await db
                    .select()
                    .from(logs)
                    .where(eq(logs.dateKey, todayKey));

                const logMap = new Map(todayLogs.map((log: any) => [log.habitId, log]));

                const habitsWithStatus: HabitWithStatus[] = allHabits.map((habit: any) => ({
                    ...habit,
                    isCompletedToday: logMap.has(habit.id),
                    todayLogId: (logMap.get(habit.id) as any)?.id ?? null,
                }));

                set({ habits: habitsWithStatus, isLoading: false });
            }
            set({ isLoading: false });
            // Increment version to signal refresh
            set(state => ({ version: state.version + 1 }));
        } catch (error) {
            console.error('[HabitStore] Failed to load habits:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to load habits',
                isLoading: false
            });
        }
    },

    /**
     * Toggle a habit's completion status for a given date
     */
    toggleHabit: async (habitId: string, dateKey?: string) => {
        const targetDateKey = dateKey ?? getTodayDateKey();

        try {
            if (isWeb) {
                // Web: Use in-memory storage
                const { _webLogs } = get();
                const existingLogIndex = _webLogs.findIndex(
                    log => log.habitId === habitId && log.dateKey === targetDateKey
                );

                if (existingLogIndex >= 0) {
                    // Remove the log
                    const newLogs = [..._webLogs];
                    newLogs.splice(existingLogIndex, 1);
                    set({ _webLogs: newLogs });
                    console.log(`[HabitStore] Uncompleted habit ${habitId} for ${targetDateKey}`);
                } else {
                    // Add new log
                    const newLog = {
                        id: generateId(),
                        habitId,
                        dateKey: targetDateKey,
                        completedAt: new Date(),
                    };
                    set({ _webLogs: [..._webLogs, newLog] });
                    console.log(`[HabitStore] Completed habit ${habitId} for ${targetDateKey}`);
                    // Play completion sound
                    const { SoundManager } = require('../utils/SoundManager');
                    SoundManager.playCompletionSound();
                }
            } else {
                // Native: Use SQLite
                const { getDb } = require('../db');
                const { eq, and } = require('drizzle-orm');
                const { logs } = require('../db/schema');

                const db = getDb();

                const existingLogs = await db
                    .select()
                    .from(logs)
                    .where(and(eq(logs.habitId, habitId), eq(logs.dateKey, targetDateKey)));

                if (existingLogs.length > 0) {
                    await db.delete(logs).where(eq(logs.id, existingLogs[0].id));
                    console.log(`[HabitStore] Uncompleted habit ${habitId} for ${targetDateKey}`);
                } else {
                    await db.insert(logs).values({
                        id: generateId(),
                        habitId,
                        dateKey: targetDateKey,
                        completedAt: new Date(),
                    });
                    console.log(`[HabitStore] Completed habit ${habitId} for ${targetDateKey}`);
                    // Play completion sound
                    const { SoundManager } = require('../utils/SoundManager');
                    SoundManager.playCompletionSound();
                }
            }

            // Reload habits to reflect the change
            await get().loadHabits();
        } catch (error) {
            console.error('[HabitStore] Failed to toggle habit:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to toggle habit'
            });
        }
    },

    /**
     * Add a new habit to track
     */
    addHabit: async (title: string, iconKey: string = 'Circle', color: string = '#ffb347', reminderTime?: string, type: 'positive' | 'negative' = 'positive') => {
        try {
            const newHabit = {
                id: generateId(),
                title,
                iconKey,
                color,
                type,
                reminderTime: reminderTime ?? null,
                archived: false,
                createdAt: new Date(),
            };

            if (isWeb) {
                // Web: Use in-memory storage
                const { _webHabits } = get();
                set({ _webHabits: [..._webHabits, newHabit] });
            } else {
                // Native: Use SQLite
                const { getDb } = require('../db');
                const { habits } = require('../db/schema');

                const db = getDb();
                await db.insert(habits).values(newHabit);
            }

            console.log(`[HabitStore] Added new habit: ${title}`);
            await get().loadHabits();
            set(state => ({ version: state.version + 1 }));
        } catch (error) {
            console.error('[HabitStore] Failed to add habit:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to add habit'
            });
        }
    },

    /**
     * Archive a habit (soft delete - keeps historical data)
     */
    archiveHabit: async (habitId: string) => {
        try {
            if (isWeb) {
                const { _webHabits } = get();
                const updatedHabits = _webHabits.map(h =>
                    h.id === habitId ? { ...h, archived: true } : h
                );
                set({ _webHabits: updatedHabits });
            } else {
                const { getDb } = require('../db');
                const { eq } = require('drizzle-orm');
                const { habits } = require('../db/schema');

                const db = getDb();
                await db.update(habits).set({ archived: 1 }).where(eq(habits.id, habitId));
            }

            console.log(`[HabitStore] Archived habit ${habitId}`);
            await get().loadHabits();
            set(state => ({ version: state.version + 1 }));
        } catch (error) {
            console.error('[HabitStore] Failed to archive habit:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to archive habit'
            });
        }
    },

    /**
     * Permanently delete a habit and all its logs
     */
    deleteHabit: async (habitId: string) => {
        try {
            if (isWeb) {
                const { _webHabits, _webLogs } = get();
                set({
                    _webHabits: _webHabits.filter(h => h.id !== habitId),
                    _webLogs: _webLogs.filter(l => l.habitId !== habitId),
                });
            } else {
                const { getDb } = require('../db');
                const { eq } = require('drizzle-orm');
                const { habits, logs } = require('../db/schema');

                const db = getDb();
                // Explicitly delete logs first (safeguard against FKs being off)
                await db.delete(logs).where(eq(logs.habitId, habitId));
                await db.delete(habits).where(eq(habits.id, habitId));
            }

            console.log(`[HabitStore] Deleted habit ${habitId}`);
            await get().loadHabits();
            set(state => ({ version: state.version + 1 }));
        } catch (error) {
            console.error('[HabitStore] Failed to delete habit:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to delete habit'
            });
        }
    },

    /**
     * Get habits with last 7 days sparkline data
     * Sparkline now includes: { hasLog: boolean, isBeforeCreation: boolean }
     */
    getHabitsWithSparkline: async () => {
        try {
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() - (6 - i));
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return { dateKey: `${year}-${month}-${day}`, date: new Date(d) };
            });

            if (isWeb) {
                const { _webHabits, _webLogs } = get();
                return _webHabits
                    .filter(h => !h.archived)
                    .map(habit => {
                        const createdAt = habit.createdAt ? new Date(habit.createdAt) : null;
                        // Set createdAt to start of day for comparison
                        const createdAtDay = createdAt ? new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()) : null;

                        const sparkline = last7Days.map(({ dateKey, date }) => {
                            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                            const isBeforeCreation = createdAtDay ? dayStart < createdAtDay : false;
                            const hasLog = _webLogs.some(l => l.habitId === habit.id && l.dateKey === dateKey);
                            return { hasLog, isBeforeCreation };
                        });

                        const todayLog = _webLogs.find(l => l.habitId === habit.id && l.dateKey === getTodayDateKey());

                        return {
                            ...habit,
                            isCompletedToday: !!todayLog,
                            todayLogId: todayLog?.id ?? null,
                            sparkline,
                        };
                    });
            } else {
                const { getDb } = require('../db');
                const { eq } = require('drizzle-orm');
                const { habits, logs } = require('../db/schema');
                const db = getDb();

                const activeHabits = await db
                    .select()
                    .from(habits)
                    .where(eq(habits.archived, false));

                const allLogs = await db.select().from(logs);

                return activeHabits.map((habit: any) => {
                    const habitLogs = allLogs.filter((l: any) => l.habitId === habit.id);
                    const createdAt = habit.createdAt ? new Date(habit.createdAt) : null;
                    const createdAtDay = createdAt ? new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()) : null;

                    const sparkline = last7Days.map(({ dateKey, date }) => {
                        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        const isBeforeCreation = createdAtDay ? dayStart < createdAtDay : false;
                        const hasLog = habitLogs.some((l: any) => l.dateKey === dateKey);
                        return { hasLog, isBeforeCreation };
                    });

                    const todayLog = habitLogs.find((l: any) => l.dateKey === getTodayDateKey());

                    return {
                        ...habit,
                        isCompletedToday: !!todayLog,
                        todayLogId: todayLog?.id ?? null,
                        sparkline,
                        color: habit.color || '#ffb347',
                    };
                });
            }
        } catch (error) {
            console.error('[HabitStore] Failed to get sparkline data:', error);
            return [];
        }
    },

    /**
     * Get detailed stats for a habit
     */
    getHabitDetails: async (habitId: string) => {
        try {
            let habitLogs: any[] = [];

            if (isWeb) {
                const { _webLogs } = get();
                habitLogs = _webLogs.filter(l => l.habitId === habitId);
            } else {
                const { getDb } = require('../db');
                const { eq } = require('drizzle-orm');
                const { logs } = require('../db/schema');
                const db = getDb();
                habitLogs = await db.select().from(logs).where(eq(logs.habitId, habitId));
            }

            // Calculate Streak - Sort logs by date descending
            const sortedLogs = [...habitLogs].sort((a, b) =>
                new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime()
            );

            let currentStreak = 0;
            const todayKey = getTodayDateKey();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

            const completedToday = sortedLogs.some(l => l.dateKey === todayKey);
            const completedYesterday = sortedLogs.some(l => l.dateKey === yesterdayKey);

            if (completedToday || completedYesterday) {
                let checkDate = new Date();
                if (!completedToday) {
                    checkDate.setDate(checkDate.getDate() - 1);
                }

                while (true) {
                    const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                    const hasLog = sortedLogs.some(l => l.dateKey === dateKey);

                    if (hasLog) {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }

            // Get habit details for type and createdAt
            const { habits } = get();
            const habit = habits.find(h => h.id === habitId);
            const isNegative = habit?.type === 'negative';
            const createdAt = habit?.createdAt ? new Date(habit.createdAt) : null;
            const createdAtStartOfDay = createdAt
                ? new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
                : null;

            // Calculate Consistency Score
            // Use min(30 days, days since creation) as the denominator
            const today = new Date();
            const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            let daysSinceCreation = 30; // Default to 30 if no createdAt
            if (createdAtStartOfDay) {
                daysSinceCreation = Math.floor((todayStartOfDay.getTime() - createdAtStartOfDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            }
            const periodDays = Math.min(30, Math.max(1, daysSinceCreation)); // At least 1 day

            // Calculate start date for the period
            const periodStart = new Date(todayStartOfDay);
            periodStart.setDate(periodStart.getDate() - periodDays + 1);

            // If habit is newer than 30 days, use creation date as start
            const effectiveStart = createdAtStartOfDay && createdAtStartOfDay > periodStart
                ? createdAtStartOfDay
                : periodStart;

            // Count logs in the period
            const logsInPeriod = habitLogs.filter(l => {
                const logDate = new Date(l.dateKey);
                return logDate >= effectiveStart && logDate <= todayStartOfDay;
            }).length;

            let consistencyScore: number;
            if (isNegative) {
                // Negative habit: abstinence = days WITHOUT logs / total days
                const daysWithoutLogs = periodDays - logsInPeriod;
                consistencyScore = Math.round((daysWithoutLogs / periodDays) * 100);
            } else {
                // Positive habit: consistency = days WITH logs / total days
                consistencyScore = Math.round((logsInPeriod / periodDays) * 100);
            }

            return {
                logs: habitLogs,
                currentStreak,
                consistencyScore,
                totalCompletions: habitLogs.length,
            };

        } catch (error) {
            console.error('[HabitStore] Failed to get habit details:', error);
            return {
                logs: [],
                currentStreak: 0,
                consistencyScore: 0,
                totalCompletions: 0,
            };
        }
    },
}));
