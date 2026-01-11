/**
 * HabitSparklineCard - "Constellation Card" UI
 * 
 * Displays a habit with a 7-day sparkline visualization (constellation).
 * Tapping navigates to details. Long press toggles today's status.
 * 
 * Supports both positive (build) and negative (break) habits:
 * - Positive: Orange dots for completions, goal is to fill the line
 * - Negative: Yellow dots for abstinence, red dots for failures
 * 
 * Days before habit creation are shown as dimmed/gray.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Icons from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { GlassCard } from './ui/GlassCard';

// Colors for habit types
const CRIMSON = '#ff4d4d';      // Failure red
const GOLD = '#FFD700';         // Abstinence gold/yellow
const DIM_GRAY = 'rgba(255, 255, 255, 0.05)'; // Pre-creation dimmed

// Sparkline data type - now includes isBeforeCreation
type SparklineDay = {
    hasLog: boolean;
    isBeforeCreation: boolean;
} | boolean; // Support both old (boolean) and new format

interface HabitSparklineCardProps {
    id: string;
    title: string;
    iconKey: string;
    color: string;
    sparkline: SparklineDay[]; // Last 7 days
    isCompletedToday: boolean;
    type?: 'positive' | 'negative';
    onToggle: () => void;
}

// Helper for color opacity
const configColor = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const HabitSparklineCard: React.FC<HabitSparklineCardProps> = ({
    id,
    title,
    iconKey,
    color,
    sparkline,
    isCompletedToday,
    type = 'positive',
    onToggle,
}) => {
    const router = useRouter();
    const isNegative = type === 'negative';

    // Dynamically load icon
    const IconComponent = (Icons as any)[iconKey] || Icons.Circle;

    // Normalize sparkline to new format
    const normalizedSparkline = sparkline.map(day => {
        if (typeof day === 'boolean') {
            return { hasLog: day, isBeforeCreation: false };
        }
        return day;
    });

    // Calculate streak based on habit type (only count days after creation)
    const calculateStreak = () => {
        if (isNegative) {
            // Negative habit: consecutive days WITHOUT a log from today backwards
            let streak = 0;
            for (let i = normalizedSparkline.length - 1; i >= 0; i--) {
                const day = normalizedSparkline[i];
                if (day.isBeforeCreation) continue; // Skip pre-creation
                if (!day.hasLog) {
                    streak++;
                } else {
                    break; // Hit a failure day
                }
            }
            return streak;
        } else {
            // Positive habit: consecutive days WITH a log
            let streak = 0;
            for (let i = normalizedSparkline.length - 1; i >= 0; i--) {
                const day = normalizedSparkline[i];
                if (day.isBeforeCreation) continue; // Skip pre-creation
                if (day.hasLog) {
                    streak++;
                } else {
                    if (i === normalizedSparkline.length - 1) continue; // Today not done yet
                    break;
                }
            }
            return streak;
        }
    };

    const currentStreak = calculateStreak();

    const handlePress = () => {
        router.push(`/habit/${id}`);
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onToggle();
    };

    // Get accent color for the habit based on type
    const accentColor = isNegative ? GOLD : COLORS.bioOrange;

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={handleLongPress}
            delayLongPress={500}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
        >
            <View style={[
                styles.cardWrapper,
                isNegative && styles.cardWrapperNegative
            ]}>
                <GlassCard>
                    {/* Top Row: Icon, Title, Streak */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: configColor(color, 0.1) }]}>
                                <IconComponent size={20} color={color} strokeWidth={2} />
                            </View>
                            <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        </View>

                        {currentStreak > 0 && (
                            <View style={[
                                styles.streakContainer,
                                { backgroundColor: configColor(accentColor, 0.1) }
                            ]}>
                                <Icons.Flame size={14} color={accentColor} fill={accentColor} />
                                <Text style={[styles.streakText, { color: accentColor }]}>{currentStreak}</Text>
                            </View>
                        )}
                    </View>

                    {/* Bottom Row: Sparkline */}
                    <View style={styles.sparklineContainer}>
                        {normalizedSparkline.map((day, index) => {
                            let dotColor: string;
                            let isFilled: boolean;
                            let isDimmed = day.isBeforeCreation;

                            if (isDimmed) {
                                // Pre-creation: show as very dim, no glow
                                dotColor = DIM_GRAY;
                                isFilled = false;
                            } else if (isNegative) {
                                // Negative habit:
                                // No log = abstinence (success) = Yellow filled
                                // Has log = failure = Red filled
                                isFilled = true;
                                dotColor = day.hasLog ? CRIMSON : GOLD;
                            } else {
                                // Positive habit:
                                // Has log = completed = Orange filled
                                // No log = missed = empty ring
                                isFilled = day.hasLog;
                                dotColor = COLORS.bioOrange;
                            }

                            return (
                                <View key={index} style={styles.dotWrapper}>
                                    <View
                                        style={[
                                            styles.dot,
                                            isFilled
                                                ? { backgroundColor: dotColor, borderColor: dotColor }
                                                : isDimmed
                                                    ? styles.dotDimmed
                                                    : styles.dotEmpty
                                        ]}
                                    />
                                    {/* Glow effect for filled dots (not for dimmed) */}
                                    {isFilled && !isDimmed && (
                                        <View style={[
                                            styles.dotGlow,
                                            { backgroundColor: dotColor }
                                        ]} />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </GlassCard>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardWrapperNegative: {
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)', // Subtle gold border
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.mist,
        letterSpacing: 0.5,
        flex: 1,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    streakText: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: 10,
    },
    sparklineContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginTop: 12,
    },
    dotWrapper: {
        width: 12,
        height: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.5,
    },
    dotEmpty: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(238, 238, 238, 0.2)',
    },
    dotDimmed: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    dotGlow: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        opacity: 0.3,
        zIndex: -1,
    },
});
