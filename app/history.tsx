/**
 * History Screen - Constellation Map
 * 
 * Shows the last 30 days of habit completion as a star map.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { HistoryMap, type DayData } from '../src/components';
import { COLORS, TYPOGRAPHY } from '../src/theme';

/**
 * Generate mock history data for the last 30 days
 * In production, this would come from the database
 */
const generateMockHistoryData = (): DayData[] => {
    const data: DayData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const dateKey = date.toISOString().split('T')[0];
        const totalCount = 5;

        // Generate varied mock completion data
        let completedCount: number;
        if (i < 3) {
            completedCount = Math.floor(Math.random() * 6);
        } else if (i >= 5 && i <= 10) {
            completedCount = 5;
        } else if (i >= 15 && i <= 18) {
            completedCount = 5;
        } else {
            completedCount = Math.floor(Math.random() * 4);
        }

        data.push({
            dateKey,
            completedCount,
            totalCount,
        });
    }

    return data;
};

export default function HistoryScreen() {
    const historyData = useMemo(() => generateMockHistoryData(), []);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>HISTORY</Text>
                <Text style={styles.subtitle}>Your journey through the void</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Constellation Map */}
            <HistoryMap data={historyData} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 8,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.xl,
        color: COLORS.mist,
        letterSpacing: 3,
    },
    subtitle: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.bioOrange,
        letterSpacing: 1,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.mist,
        opacity: 0.1,
        marginVertical: 16,
    },
});
