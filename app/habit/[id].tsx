/**
 * Habit Detail Screen
 * 
 * Shows deep analytics for a specific habit:
 * 1. Full Calendar view with month navigation
 * 2. Consistency Graph (Rolling 7-day average)
 * 3. Stats grid
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ArrowLeft, Calendar, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, BORDER_RADIUS } from '../../src/theme';
import { useHabitStore } from '../../src/stores';
import { GlassCard } from '../../src/components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Colors
const GOLD = '#FFD700';
const CRIMSON = '#ff4d4d';

// Days of week labels
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Get date key string
const getDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Range options for the graph
type TimeRange = '1M' | '3M' | '6M';

export default function HabitDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { habits, getHabitDetails, loadHabits, deleteHabit, toggleHabit, version } = useHabitStore();

    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState<any>(null);
    const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');

    // Calendar state
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // Find habit from store
    const habit = habits.find(h => h.id === id);
    const isNegative = habit?.type === 'negative';

    useEffect(() => {
        if (habits.length === 0) {
            loadHabits();
        }
    }, [habits.length]);

    useEffect(() => {
        loadDetails();
    }, [id, version]);

    const loadDetails = async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getHabitDetails(id as string);
        setDetails(data);
        setIsLoading(false);
    };

    const handleBack = () => {
        Haptics.selectionAsync();
        router.replace('/');
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Delete into the void?",
            "This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: 'destructive',
                    onPress: async () => {
                        await deleteHabit(id as string);
                        router.replace('/');
                    }
                }
            ]
        );
    };

    // Handle tapping a calendar day to toggle habit status
    const handleDayPress = async (dateKey: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await toggleHabit(id as string, dateKey);
        await loadDetails(); // Refresh the data
    };

    // Calculate current streak based on habit type
    const calculateStreak = useMemo(() => {
        if (!details || !details.logs || !habit) return 0;

        const today = new Date();
        const todayKey = getDateKey(today);
        const createdAt = habit.createdAt ? new Date(habit.createdAt) : null;
        const createdAtStartOfDay = createdAt
            ? new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
            : null;

        if (isNegative) {
            // Negative habit: streak = consecutive days without a log (failure)
            // Start from today and go backwards
            let streak = 0;

            for (let i = 0; i <= 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const checkKey = getDateKey(checkDate);

                // Stop if before habit creation
                if (createdAtStartOfDay && checkDate < createdAtStartOfDay) {
                    break;
                }

                const hasLog = details.logs.some((l: any) => l.dateKey === checkKey);

                if (hasLog) {
                    // Found a failure, streak ends
                    break;
                } else {
                    streak++;
                }
            }
            return streak;
        } else {
            // Positive habit: consecutive days from today backwards with logs
            let streak = 0;

            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const checkKey = getDateKey(checkDate);

                // Stop if before habit creation
                if (createdAtStartOfDay && checkDate < createdAtStartOfDay) {
                    break;
                }

                const hasLog = details.logs.some((l: any) => l.dateKey === checkKey);

                if (hasLog) {
                    streak++;
                } else if (i > 0) { // Skip today if not done yet
                    break;
                }
            }
            return streak;
        }
    }, [details, habit, isNegative]);

    // Calculate longest streak 
    const longestStreak = useMemo(() => {
        if (!details || !details.logs || !habit) return 0;

        const createdAt = habit.createdAt ? new Date(habit.createdAt) : null;
        const createdAtStartOfDay = createdAt
            ? new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
            : null;
        const today = new Date();

        let maxStreak = 0;
        let currentStreak = 0;

        // Calculate from creation date to today
        const startDate = createdAtStartOfDay || new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        for (let i = 0; i <= daysDiff; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(checkDate.getDate() + i);
            const checkKey = getDateKey(checkDate);

            const hasLog = details.logs.some((l: any) => l.dateKey === checkKey);

            if (isNegative) {
                // Negative habit: streak when NO log (abstinence)
                if (!hasLog) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0; // Reset on failure
                }
            } else {
                // Positive habit: streak when HAS log
                if (hasLog) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0; // Reset on miss
                }
            }
        }

        return maxStreak;
    }, [details, habit, isNegative]);

    // --- CHART GENERATION LOGIC ---
    const chartData = useMemo(() => {
        if (!details || !details.logs) return null;

        const rangeDays = selectedRange === '1M' ? 30 : selectedRange === '3M' ? 90 : 180;
        const dataPoints = [];
        const today = new Date();

        for (let i = rangeDays - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            let completedInWindow = 0;
            for (let j = 0; j < 7; j++) {
                const wDate = new Date(date);
                wDate.setDate(wDate.getDate() - j);
                const wKey = wDate.toISOString().split('T')[0];
                if (details.logs.some((l: any) => l.dateKey === wKey)) {
                    completedInWindow++;
                }
            }
            const avg = completedInWindow / 7;
            dataPoints.push(avg);
        }

        return dataPoints;
    }, [details, selectedRange]);

    // Generate SVG Path for chart
    const renderChart = () => {
        if (!chartData || chartData.length === 0) return null;

        const height = 150;
        const width = SCREEN_WIDTH - 48 - 40;
        const stepX = width / (chartData.length - 1);

        let pathD = `M 0 ${height - (chartData[0] * height)}`;
        chartData.forEach((val, index) => {
            const x = index * stepX;
            const y = height - (val * height);
            pathD += ` L ${x} ${y}`;
        });

        const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
        const accentColor = isNegative ? GOLD : COLORS.bioOrange;

        return (
            <View style={styles.chartContainer}>
                <Svg height={height} width={width}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={accentColor} stopOpacity="0.5" />
                            <Stop offset="1" stopColor={accentColor} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <Path d={areaD} fill="url(#grad)" />
                    <Path d={pathD} stroke={accentColor} strokeWidth="2" fill="none" />
                </Svg>
            </View>
        );
    };

    // --- FULL CALENDAR LOGIC ---
    const renderCalendar = () => {
        if (!details || !habit) return null;

        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const createdAt = habit.createdAt ? new Date(habit.createdAt) : null;
        // Normalize createdAt to start of day for comparison (ignore time)
        const createdAtStartOfDay = createdAt
            ? new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
            : null;
        const today = new Date();
        const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayKey = getDateKey(today);

        // Build calendar grid
        const cells = [];

        // Empty cells before first day
        for (let i = 0; i < startDayOfWeek; i++) {
            cells.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = getDateKey(date);
            const hasLog = details.logs.some((l: any) => l.dateKey === dateKey);
            // Compare dates at start of day to ignore time
            const isBeforeCreation = createdAtStartOfDay && date < createdAtStartOfDay;
            const isFuture = date > todayStartOfDay;
            const isToday = dateKey === todayKey;

            let cellStyle = styles.calendarCellEmpty;
            let cellColor = 'rgba(255, 255, 255, 0.1)';

            if (isBeforeCreation || isFuture) {
                cellColor = 'rgba(255, 255, 255, 0.03)';
            } else if (isNegative) {
                // Negative: Yellow for abstinence, Red for failure
                if (hasLog) {
                    cellColor = CRIMSON; // Failure
                } else {
                    cellColor = GOLD; // Abstinence
                }
                cellStyle = styles.calendarCellFilled;
            } else {
                // Positive: Orange for completed, empty for missed
                if (hasLog) {
                    cellColor = COLORS.bioOrange;
                    cellStyle = styles.calendarCellFilled;
                }
            }

            const canToggle = !isFuture && !isBeforeCreation;
            const isDisabled = isBeforeCreation || isFuture;

            // Determine visual style
            let showCircle = false;
            let circleColor = 'transparent';

            if (!isDisabled) {
                if (isNegative) {
                    // Negative habit: Always show circles
                    // Yellow for abstinence, Red for failure
                    showCircle = true;
                    circleColor = hasLog ? CRIMSON : GOLD;
                } else {
                    // Positive habit: Only show circle when completed
                    if (hasLog) {
                        showCircle = true;
                        circleColor = COLORS.bioOrange;
                    }
                }
            }

            cells.push(
                <Pressable
                    key={dateKey}
                    style={styles.calendarCell}
                    onPress={() => canToggle && handleDayPress(dateKey)}
                    disabled={!canToggle}
                >
                    <View style={[
                        styles.calendarDot,
                        showCircle && { backgroundColor: circleColor },
                        isToday && styles.calendarDotToday
                    ]}>
                        <Text style={[
                            styles.calendarDayText,
                            isBeforeCreation && styles.calendarDayTextDisabled,
                            showCircle && { color: COLORS.voidBlue, fontWeight: 'bold' }
                        ]}>{day}</Text>
                    </View>
                </Pressable>
            );
        }

        return (
            <View>
                {/* Weekday headers */}
                <View style={styles.weekdayRow}>
                    {WEEKDAYS.map((day, i) => (
                        <Text key={i} style={styles.weekdayText}>{day}</Text>
                    ))}
                </View>
                {/* Calendar grid */}
                <View style={styles.calendarGrid}>
                    {cells}
                </View>
            </View>
        );
    };

    // Navigate months
    const goToPrevMonth = () => {
        const prevMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
        // Don't allow navigating before habit creation month
        if (habit?.createdAt) {
            const createdMonth = new Date(habit.createdAt);
            const createdMonthStart = new Date(createdMonth.getFullYear(), createdMonth.getMonth(), 1);
            if (prevMonth < createdMonthStart) {
                return; // Don't navigate before creation month
            }
        }
        Haptics.selectionAsync();
        setCalendarDate(prevMonth);
    };

    const goToNextMonth = () => {
        Haptics.selectionAsync();
        const nextMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
        if (nextMonth <= new Date()) {
            setCalendarDate(nextMonth);
        }
    };

    // Get available months/years
    const getAvailableMonths = useMemo(() => {
        if (!habit?.createdAt) return [];
        const start = new Date(habit.createdAt);
        const end = new Date();
        const months = [];

        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
            months.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
        }
        return months;
    }, [habit]);

    const accentColor = isNegative ? GOLD : COLORS.bioOrange;

    if (!habit) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.bioOrange} style={{ marginTop: 100 }} />
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.iconButton}>
                    <ArrowLeft size={24} color={COLORS.mist} />
                </Pressable>
                <Text style={styles.headerTitle}>DETAILS</Text>
                <Pressable onPress={handleDelete} style={styles.iconButton}>
                    <Trash2 size={24} color={COLORS.mist} opacity={0.5} />
                </Pressable>
            </View>

            {/* Title & Streak */}
            <View style={styles.heroSection}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <View style={styles.streakBadge}>
                    <Text style={[styles.streakNumber, { color: accentColor }]}>{calculateStreak}</Text>
                    <Text style={[styles.streakLabel, { color: accentColor }]}>
                        {isNegative ? 'DAYS CLEAN' : 'DAY STREAK'}
                    </Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={accentColor} style={{ marginTop: 40 }} />
            ) : (
                <>
                    {/* Calendar Section */}
                    <GlassCard style={styles.cardSection}>
                        <View style={styles.sectionHeader}>
                            <Pressable onPress={goToPrevMonth} style={styles.navButton}>
                                <ChevronLeft size={20} color={COLORS.mist} />
                            </Pressable>
                            <Pressable onPress={() => setShowMonthPicker(true)} style={styles.monthYearButton}>
                                <Calendar size={16} color={accentColor} />
                                <Text style={[styles.monthYearText, { color: accentColor }]}>
                                    {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Text>
                            </Pressable>
                            <Pressable onPress={goToNextMonth} style={styles.navButton}>
                                <ChevronRight size={20} color={COLORS.mist} />
                            </Pressable>
                        </View>
                        {renderCalendar()}
                    </GlassCard>

                    {/* Streak Comparison Section */}
                    <GlassCard style={styles.cardSection}>
                        <Text style={styles.sectionTitle}>STREAK COMPARISON</Text>
                        <View style={styles.streakComparisonContainer}>
                            {/* Current Streak */}
                            <View style={styles.streakColumn}>
                                <Text style={[styles.streakCompareValue, { color: accentColor }]}>
                                    {calculateStreak}
                                </Text>
                                <Text style={styles.streakCompareLabel}>Current</Text>
                            </View>

                            {/* VS divider */}
                            <View style={styles.vsDivider}>
                                <Text style={styles.vsText}>vs</Text>
                            </View>

                            {/* Longest Streak */}
                            <View style={styles.streakColumn}>
                                <Text style={[styles.streakCompareValue, { color: COLORS.mist }]}>
                                    {longestStreak}
                                </Text>
                                <Text style={styles.streakCompareLabel}>Best</Text>
                            </View>
                        </View>

                        {/* Progress bar showing current vs longest */}
                        <View style={styles.streakProgressContainer}>
                            <View style={styles.streakProgressBg}>
                                <View style={[
                                    styles.streakProgressFill,
                                    {
                                        width: longestStreak > 0
                                            ? `${Math.min((calculateStreak / longestStreak) * 100, 100)}%`
                                            : '0%',
                                        backgroundColor: accentColor
                                    }
                                ]} />
                            </View>
                            <Text style={styles.streakProgressText}>
                                {longestStreak > 0
                                    ? `${Math.round((calculateStreak / longestStreak) * 100)}% of best`
                                    : 'Start your streak!'}
                            </Text>
                        </View>
                    </GlassCard>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <GlassCard style={styles.statBox}>
                            <Text style={styles.statValue}>{details?.totalCompletions || 0}</Text>
                            <Text style={styles.statLabel}>{isNegative ? 'Failures' : 'Total'}</Text>
                        </GlassCard>
                        <GlassCard style={styles.statBox}>
                            <Text style={styles.statValue}>{details?.consistencyScore || 0}%</Text>
                            <Text style={styles.statLabel}>{isNegative ? 'Abstinence' : 'Consistency'}</Text>
                        </GlassCard>
                    </View>
                </>
            )}

            {/* Month Picker Modal */}
            <Modal visible={showMonthPicker} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setShowMonthPicker(false)}>
                    <View style={styles.monthPickerContainer}>
                        <Text style={styles.monthPickerTitle}>Select Month</Text>
                        <ScrollView style={styles.monthList}>
                            {getAvailableMonths.map((date, index) => (
                                <Pressable
                                    key={index}
                                    style={[
                                        styles.monthOption,
                                        date.getMonth() === calendarDate.getMonth() &&
                                        date.getFullYear() === calendarDate.getFullYear() &&
                                        styles.monthOptionActive
                                    ]}
                                    onPress={() => {
                                        setCalendarDate(date);
                                        setShowMonthPicker(false);
                                    }}
                                >
                                    <Text style={styles.monthOptionText}>
                                        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.voidBlue,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        marginBottom: 8,
    },
    headerTitle: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        color: COLORS.mist,
        opacity: 0.5,
        letterSpacing: 2,
    },
    iconButton: {
        padding: 8,
    },
    heroSection: {
        alignItems: 'center',
        marginVertical: 24,
    },
    habitTitle: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.xl,
        color: COLORS.mist,
        marginBottom: 16,
        textAlign: 'center',
    },
    streakBadge: {
        alignItems: 'center',
    },
    streakNumber: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: 64,
        lineHeight: 70,
    },
    streakLabel: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        letterSpacing: 4,
        opacity: 0.8,
    },
    cardSection: {
        marginBottom: 20,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        letterSpacing: 1,
    },
    navButton: {
        padding: 4,
    },
    monthYearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    monthYearText: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.sm,
    },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekdayText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: 10,
        color: COLORS.mist,
        opacity: 0.5,
        width: 32,
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarDot: {
        width: 32,
        height: 32,
        borderRadius: 16, // Perfect circle
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarCellEmpty: {},
    calendarCellFilled: {},
    calendarDotToday: {
        borderWidth: 2,
        borderColor: COLORS.mist,
    },
    calendarDayText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: 11,
        color: COLORS.mist,
    },
    calendarDayTextDisabled: {
        color: 'rgba(255, 255, 255, 0.2)', // Grayed out
    },
    filters: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    filterText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: 10,
        color: COLORS.mist,
    },
    filterTextActive: {
        color: COLORS.voidBlue,
        fontWeight: 'bold',
    },
    chartContainer: {
        height: 150,
        marginTop: 16,
        justifyContent: 'flex-end',
    },
    chartSubtitle: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: 10,
        color: COLORS.mist,
        opacity: 0.4,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
    },
    statValue: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: 24,
        color: COLORS.mist,
        marginBottom: 4,
    },
    statLabel: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: 10,
        color: COLORS.mist,
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    backButton: {
        padding: 20,
        alignItems: 'center',
    },
    backButtonText: {
        color: COLORS.mist,
        fontFamily: TYPOGRAPHY.fonts.mono,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthPickerContainer: {
        backgroundColor: COLORS.voidBlue,
        borderRadius: 16,
        padding: 20,
        width: '80%',
        maxHeight: '60%',
    },
    monthPickerTitle: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.mist,
        marginBottom: 16,
        textAlign: 'center',
    },
    monthList: {
        maxHeight: 300,
    },
    monthOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    monthOptionActive: {
        backgroundColor: 'rgba(255, 179, 71, 0.2)',
    },
    monthOptionText: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.base,
        color: COLORS.mist,
        textAlign: 'center',
    },
    // Streak comparison styles
    streakComparisonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    streakColumn: {
        alignItems: 'center',
        flex: 1,
    },
    streakCompareValue: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: 48,
        lineHeight: 52,
    },
    streakCompareLabel: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        opacity: 0.6,
        letterSpacing: 2,
        marginTop: 4,
    },
    vsDivider: {
        paddingHorizontal: 16,
    },
    vsText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
        opacity: 0.3,
    },
    streakProgressContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    streakProgressBg: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    streakProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    streakProgressText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        opacity: 0.5,
        marginTop: 8,
    },
});
