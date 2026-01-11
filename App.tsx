import './global.css';

import React, { useEffect, useState, useMemo } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Plus } from 'lucide-react-native';

import { DailyList, WatcherAvatar, HistoryMap, type DayData } from './src/components';
import { COLORS, TYPOGRAPHY } from './src/theme';
import { initializeDatabase } from './src/db';
import { useHabitStore } from './src/stores';

/**
 * Void Tracker - Lo-Fi Minimalist Life Tracker
 * 
 * App entry point with font loading, database initialization,
 * and the main habit tracking interface.
 */

// Sample habits for testing
const SAMPLE_HABITS = [
  { title: 'Read for 30 minutes', iconKey: 'Book' },
  { title: 'Morning workout', iconKey: 'Dumbbell' },
  { title: 'Write code', iconKey: 'Code' },
  { title: 'Meditate', iconKey: 'Brain' },
  { title: 'Drink 8 glasses of water', iconKey: 'Droplets' },
];

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
    // Create some streaks and some gaps
    let completedCount: number;
    if (i < 3) {
      // Recent days - random
      completedCount = Math.floor(Math.random() * 6);
    } else if (i >= 5 && i <= 10) {
      // Perfect streak period
      completedCount = 5;
    } else if (i >= 15 && i <= 18) {
      // Another streak
      completedCount = 5;
    } else {
      // Random completion
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

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { loadHabits, habits: storeHabits, addHabit } = useHabitStore();

  // Calculate completion percentage for the avatar
  const completedCount = storeHabits.filter(h => h.isCompletedToday).length;
  const totalCount = storeHabits.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Mock history data (would come from DB in production)
  const historyData = useMemo(() => generateMockHistoryData(), []);

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        setDbReady(true);

        // Load habits after DB is ready
        await loadHabits();
      } catch (error) {
        console.error('[App] Database initialization failed:', error);
        setDbError(error instanceof Error ? error.message : 'Database error');
      }
    };

    init();
  }, []);

  // Add sample habits if none exist (for testing)
  const seedSampleHabits = async () => {
    for (const habit of SAMPLE_HABITS) {
      await addHabit(habit.title, habit.iconKey);
    }
  };

  // Show loading state while fonts and DB load
  if (!fontsLoaded || !dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.bioOrange} />
        <Text style={styles.loadingText}>
          {!fontsLoaded ? 'Loading fonts...' : 'Initializing database...'}
        </Text>
      </View>
    );
  }

  // Show error state if DB failed
  if (dbError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Database Error</Text>
        <Text style={styles.errorDetail}>{dbError}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header with Watcher Avatar */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable onPress={() => setShowHistory(!showHistory)}>
              <Text style={styles.title}>VOID TRACKER</Text>
              <Text style={styles.subtitle}>
                {showHistory ? 'tap to return' : 'a lo-fi life tracker'}
              </Text>
            </Pressable>
            <WatcherAvatar
              completionPercentage={completionPercentage}
              size={60}
            />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Toggle between Daily List and History Map */}
        {showHistory ? (
          <HistoryMap data={historyData} />
        ) : (
          <>
            {/* Daily habit list */}
            <DailyList />

            {/* Add sample habits button (for testing) */}
            {storeHabits.length === 0 && (
              <Pressable style={styles.seedButton} onPress={seedSampleHabits}>
                <Plus size={20} color={COLORS.voidBlue} strokeWidth={2} />
                <Text style={styles.seedButtonText}>Add Sample Habits</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.voidBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.voidBlue,
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.mist,
    opacity: 0.5,
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'System',
    fontSize: 18,
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorDetail: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.mist,
    opacity: 0.5,
  },
  header: {
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bioOrange,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  seedButtonText: {
    fontFamily: TYPOGRAPHY.fonts.sansMedium,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.voidBlue,
    fontWeight: '600',
  },
});
