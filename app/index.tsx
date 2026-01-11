/**
 * Dashboard Screen (Home)
 * 
 * The main screen showing centered Watcher Avatar and habit sparkline cards.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WatcherAvatar, HabitSparklineCard } from '../src/components';
import { COLORS, TYPOGRAPHY } from '../src/theme';
import { useHabitStore } from '../src/stores';
import { SoundManager } from '../src/utils/SoundManager';

// Sample habits for testing
const SAMPLE_HABITS = [
    { title: 'Read for 30 minutes', iconKey: 'Book', color: '#ffb347' },
    { title: 'Morning workout', iconKey: 'Dumbbell', color: '#ff6b6b' },
    { title: 'Write code', iconKey: 'Code', color: '#4ecdc4' },
    { title: 'Meditate', iconKey: 'Brain', color: '#a8a8a8' },
    { title: 'Drink water', iconKey: 'Droplets', color: '#45b7d1' },
];

export default function DashboardScreen() {
    const { addHabit, toggleHabit, getHabitsWithSparkline, version } = useHabitStore();
    const [sparklineHabits, setSparklineHabits] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    const loadData = async () => {
        const data = await getHabitsWithSparkline();
        setSparklineHabits(data);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [version])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleToggle = async (id: string) => {
        await SoundManager.playHabitSound();
        await toggleHabit(id);
        await loadData();
    };

    const seedSampleHabits = async () => {
        for (const habit of SAMPLE_HABITS) {
            await addHabit(habit.title, habit.iconKey, habit.color);
        }
        await loadData();
    };

    // Calculate completion for avatar
    // For positive habits: completed = has log today
    // For negative habits: success (completed) = NO log today (abstinence)
    const completedCount = sparklineHabits.filter(h => {
        if (h.type === 'negative') {
            // Negative habit: success means NO log today (abstinence)
            return !h.isCompletedToday;
        }
        // Positive habit: success means has log today
        return h.isCompletedToday;
    }).length;
    const totalCount = sparklineHabits.length;
    const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.bioOrange} />
            }
        >
            {/* Centered Avatar Header */}
            <View style={[styles.avatarContainer, { paddingTop: insets.top + 20 }]}>
                <WatcherAvatar
                    completionPercentage={completionPercentage}
                    size={80}
                />
            </View>

            {/* Habit List (Sparkline Cards) */}
            <View style={styles.listContainer}>
                {sparklineHabits.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>The void is empty.</Text>
                        <Pressable style={styles.seedButton} onPress={seedSampleHabits}>
                            <Plus size={20} color={COLORS.voidBlue} strokeWidth={2} />
                            <Text style={styles.seedButtonText}>Add Habits</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.stackContainer}>
                        {sparklineHabits.map((habit) => (
                            <HabitSparklineCard
                                key={habit.id}
                                id={habit.id}
                                title={habit.title}
                                iconKey={habit.iconKey}
                                color={habit.color}
                                sparkline={habit.sparkline}
                                isCompletedToday={habit.isCompletedToday}
                                type={habit.type}
                                onToggle={() => handleToggle(habit.id)}
                            />
                        ))}
                    </View>
                )}
            </View>

            <View style={{ height: 140 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    avatarContainer: {
        alignItems: 'center',
        paddingBottom: 24,
    },
    listContainer: {
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.base,
        color: COLORS.mist,
        opacity: 0.5,
        marginBottom: 24,
    },
    seedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.bioOrange,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        gap: 8,
    },
    seedButtonText: {
        fontFamily: TYPOGRAPHY.fonts.sansMedium,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.voidBlue,
        fontWeight: '600',
    },
    stackContainer: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 20,
    },
});
