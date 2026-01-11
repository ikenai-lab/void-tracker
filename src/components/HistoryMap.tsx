/**
 * HistoryMap - Constellation View of Habit Progress
 * 
 * Displays the last 30 days as a grid of stars.
 * - Perfect days are glowing orange stars
 * - Partial days are smaller white stars
 * - Empty days are dim grey dots
 * 
 * Includes a glowing "Constellation" effect where perfect days
 * pulse with energy.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
    useDerivedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS, TYPOGRAPHY } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLS = 7;
const STAR_SIZE_BASE = (SCREEN_WIDTH - 80) / GRID_COLS;

// Types for history data
export interface DayData {
    dateKey: string;
    completedCount: number;
    totalCount: number;
}

interface HistoryMapProps {
    data: DayData[];
}

// Star component purely for visual representation
const StarNode: React.FC<{
    status: 'perfect' | 'partial' | 'empty';
    index: number;
}> = ({ status, index }) => {
    // Animation for pulsing glow (perfect days only)
    const glowOpacity = useSharedValue(0.4);

    useEffect(() => {
        if (status === 'perfect' && Platform.OS !== 'web') {
            // Random delay to make stars twinkle independently
            const delay = Math.random() * 2000;

            setTimeout(() => {
                glowOpacity.value = withRepeat(
                    withSequence(
                        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.quad) })
                    ),
                    -1,
                    true
                );
            }, delay);
        } else if (status === 'perfect' && Platform.OS === 'web') {
            // Web fallback: simple CSS-like keyframe simulation using setTimeout loop but safer to just keep static glow
            // Avoiding complex reanimated loops on web for stability
            glowOpacity.value = 0.6;
        }
    }, [status]);

    const animatedGlow = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: 1 + (glowOpacity.value - 0.4) * 0.5 }]
    }));

    // Size based on status
    const size = status === 'perfect' ? 14 : status === 'partial' ? 8 : 4;
    const color = status === 'perfect' ? COLORS.bioOrange : status === 'partial' ? COLORS.mist : '#333333';

    return (
        <View style={[styles.starContainer, { width: STAR_SIZE_BASE, height: STAR_SIZE_BASE }]}>
            {status === 'perfect' && (
                <Animated.View style={[styles.glow, animatedGlow]} />
            )}
            <View
                style={[
                    styles.star,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: color,
                        opacity: status === 'empty' ? 0.3 : status === 'partial' ? 0.8 : 1
                    }
                ]}
            />
        </View>
    );
};

export const HistoryMap: React.FC<HistoryMapProps> = ({ data }) => {
    // Weekday headers
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Helper to determine status
    const getStatus = (day: DayData) => {
        if (day.completedCount === 0) return 'empty';
        if (day.completedCount >= day.totalCount) return 'perfect';
        return 'partial';
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CONSTELLATION</Text>
            <Text style={styles.subtitle}>Last 30 Days</Text>

            <View style={styles.gridContainer}>
                {/* Headers */}
                <View style={styles.row}>
                    {weekDays.map((day, i) => (
                        <View key={`header-${i}`} style={[styles.cell, { width: STAR_SIZE_BASE }]}>
                            <Text style={styles.headerText}>{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Stars Grid */}
                <View style={styles.grid}>
                    {data.map((day, i) => (
                        <StarNode
                            key={day.dateKey}
                            index={i}
                            status={getStatus(day)}
                        />
                    ))}
                </View>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#333', opacity: 0.5 }]} />
                    <Text style={styles.legendText}>No tasks</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.mist, opacity: 0.8 }]} />
                    <Text style={styles.legendText}>Partial</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.bioOrange }]} />
                    <Text style={styles.legendText}>Perfect</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 20,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
        letterSpacing: 4,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        opacity: 0.4,
        marginBottom: 24,
    },
    gridContainer: {
        width: '100%',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: STAR_SIZE_BASE * GRID_COLS,
    },
    cell: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    starContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    headerText: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: 10,
        color: COLORS.mist,
        opacity: 0.3,
    },
    star: {
        // Base styles handled inline
    },
    glow: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.bioOrange,
        opacity: 0.3,
        shadowColor: COLORS.bioOrange,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
    legend: {
        flexDirection: 'row',
        marginTop: 32,
        gap: 24,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: 10,
        color: COLORS.mist,
        opacity: 0.5,
    },
});

export default HistoryMap;
