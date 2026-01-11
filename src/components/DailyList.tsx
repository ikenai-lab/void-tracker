/**
 * DailyList - Today's habits with completion status
 * 
 * Renders the list of active habits for the current day,
 * powered by the Zustand habit store.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { TaskRow } from './TaskRow';
import { useHabitStore } from '../stores';
import { COLORS, TYPOGRAPHY } from '../theme';
import { getTodayDateKey } from '../db';

export const DailyList: React.FC = () => {
    const { habits, isLoading, error, loadHabits, toggleHabit } = useHabitStore();
    const todayKey = getTodayDateKey();

    // Habits are loaded by the parent DashboardScreen (app/index.tsx)

    // Format today's date for display
    const formatDate = (dateKey: string): string => {
        const date = new Date(dateKey);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.bioOrange} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const completedCount = habits.filter(h => h.isCompletedToday).length;
    const totalCount = habits.length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.dateText}>{formatDate(todayKey)}</Text>
                <Text style={styles.progressText}>
                    {completedCount}/{totalCount}
                </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Habit List */}
            {habits.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No habits yet.</Text>
                    <Text style={styles.emptySubtext}>Add your first habit to begin tracking.</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                >
                    {habits.map((habit) => (
                        <TaskRow
                            key={habit.id}
                            title={habit.title}
                            iconKey={habit.iconKey}
                            isCompleted={habit.isCompletedToday}
                            onToggle={() => toggleHabit(habit.id, todayKey)}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.base,
        color: '#ff6b6b',
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    dateText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
        opacity: 0.5,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    progressText: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.bioOrange,
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.mist,
        opacity: 0.1,
        marginBottom: 24,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 24,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
    },
    emptyText: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.mist,
        opacity: 0.5,
        marginBottom: 8,
    },
    emptySubtext: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
        opacity: 0.3,
        textAlign: 'center',
    },
});

export default DailyList;
