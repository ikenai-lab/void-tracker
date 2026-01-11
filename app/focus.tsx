/**
 * Void Focus - Deep Work Timer
 * 
 * A minimalist focus timer with circular progress and avatar eyes.
 * - Normal state: App background with presets
 * - Focus state: Pure OLED black with circular timer, eyes inside, gray timer text
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { COLORS, TYPOGRAPHY } from '../src/theme';
import { useFocusStore } from '../src/stores/useFocusStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colors
const OLED_BLACK = '#000000';
const EYE_COLOR = COLORS.bioOrange;
const RED_EYE = '#ff4d4d';
const GRAY_TEXT = 'rgba(255, 255, 255, 0.3)';

// Timer presets in minutes
const PRESETS = [15, 30, 60];

// Circular timer dimensions
const CIRCLE_SIZE = 280;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusScreen() {
    // Focus store for hiding VoidDock
    const setFocusMode = useFocusStore(state => state.setFocusMode);

    // Timer state
    const [selectedMinutes, setSelectedMinutes] = useState(30);
    const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);
    const [totalSeconds, setTotalSeconds] = useState(30 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isFocusMode, setIsFocusModeLocal] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Animation values
    const breathScale = useSharedValue(1);

    // Calculate progress (0 to 1)
    const progress = 1 - (remainingSeconds / totalSeconds);

    // Eye size based on progress (starts small, grows to full)
    const minEyeHeight = 4;
    const maxEyeHeight = 14;
    const currentEyeHeight = minEyeHeight + (progress * (maxEyeHeight - minEyeHeight));
    const currentEyeWidth = currentEyeHeight * 1.6;

    // Breathing animation interval
    const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start breathing animation
    const startBreathing = useCallback(() => {
        const animate = () => {
            breathScale.value = withTiming(1.06, { duration: 2000 }, () => {
                breathScale.value = withTiming(1.0, { duration: 2000 });
            });
        };
        animate();
        breathIntervalRef.current = setInterval(animate, 4000);
    }, [breathScale]);

    // Stop breathing
    const stopBreathing = useCallback(() => {
        if (breathIntervalRef.current) {
            clearInterval(breathIntervalRef.current);
        }
        cancelAnimation(breathScale);
        breathScale.value = 1;
    }, [breathScale]);

    // Set focus mode in store
    const enterFocusMode = () => {
        setIsFocusModeLocal(true);
        setFocusMode(true);
    };

    const exitFocusMode = () => {
        setIsFocusModeLocal(false);
        setFocusMode(false);
    };

    // Start timer
    const startTimer = () => {
        if (remainingSeconds <= 0) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsRunning(true);
        enterFocusMode();
        setIsPaused(false);
        startBreathing();
    };

    // Pause timer
    const pauseTimer = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsRunning(false);
        setIsPaused(true);
        stopBreathing();
    };

    // Resume timer
    const resumeTimer = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsRunning(true);
        setIsPaused(false);
        startBreathing();
    };

    // Stop timer (yellow button)
    const stopTimer = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIsRunning(false);
        exitFocusMode();
        setIsPaused(false);
        setRemainingSeconds(selectedMinutes * 60);
        setTotalSeconds(selectedMinutes * 60);
        stopBreathing();
    };

    // Timer tick effect
    useEffect(() => {
        if (isRunning && remainingSeconds > 0) {
            timerRef.current = setTimeout(() => {
                setRemainingSeconds(prev => prev - 1);
            }, 1000);
        } else if (remainingSeconds === 0 && isRunning) {
            setIsRunning(false);
            stopBreathing();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isRunning, remainingSeconds, stopBreathing]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            exitFocusMode();
            if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Update remaining seconds when preset changes
    useEffect(() => {
        if (!isRunning && !isFocusMode) {
            setRemainingSeconds(selectedMinutes * 60);
            setTotalSeconds(selectedMinutes * 60);
        }
    }, [selectedMinutes, isRunning, isFocusMode]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Animated styles
    const eyeContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breathScale.value }],
    }));

    // Stroke dashoffset for progress
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    // Determine eye color
    const getEyeColor = () => {
        if (remainingSeconds === 0) return EYE_COLOR;
        if (isPaused) return RED_EYE;
        return EYE_COLOR;
    };

    const eyeColor = getEyeColor();
    const isComplete = remainingSeconds === 0;
    const progressColor = isPaused ? RED_EYE : COLORS.bioOrange;

    // Focus Mode UI (pure black with circular timer)
    if (isFocusMode) {
        return (
            <View style={styles.focusContainer}>
                <StatusBar backgroundColor={OLED_BLACK} barStyle="light-content" />

                {/* Circular Timer with Eyes */}
                <Pressable
                    style={styles.circleContainer}
                    onPress={isRunning ? pauseTimer : resumeTimer}
                >
                    {/* Background circle */}
                    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.circleSvg}>
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS}
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeWidth={STROKE_WIDTH}
                            fill="transparent"
                        />
                        {/* Progress circle */}
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS}
                            stroke={progressColor}
                            strokeWidth={STROKE_WIDTH}
                            fill="transparent"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                        />
                    </Svg>

                    {/* Eyes and Timer inside circle */}
                    <Animated.View style={[styles.circleContent, eyeContainerStyle]}>
                        {isComplete ? (
                            // Happy eyes ^ ^
                            <Svg width={80} height={40} viewBox="0 0 80 40">
                                <Path
                                    d="M 10 28 Q 20 12, 30 28"
                                    stroke={eyeColor}
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <Path
                                    d="M 50 28 Q 60 12, 70 28"
                                    stroke={eyeColor}
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </Svg>
                        ) : (
                            // Growing rectangular eyes
                            <Svg width={80} height={40} viewBox="0 0 80 40">
                                <Rect
                                    x={40 - currentEyeWidth - 8}
                                    y={20 - currentEyeHeight / 2}
                                    width={currentEyeWidth}
                                    height={currentEyeHeight}
                                    rx={3}
                                    fill={eyeColor}
                                />
                                <Rect
                                    x={48}
                                    y={20 - currentEyeHeight / 2}
                                    width={currentEyeWidth}
                                    height={currentEyeHeight}
                                    rx={3}
                                    fill={eyeColor}
                                />
                            </Svg>
                        )}

                        {/* Timer text inside circle */}
                        <Text style={styles.inCircleTimer}>{formatTime(remainingSeconds)}</Text>
                    </Animated.View>
                </Pressable>

                {/* Status */}
                {isRunning && (
                    <Text style={styles.statusText}>Tap to pause</Text>
                )}
                {isPaused && (
                    <Text style={[styles.statusText, { color: RED_EYE }]}>Paused • Tap to resume</Text>
                )}
                {isComplete && (
                    <Text style={[styles.statusText, { color: COLORS.bioOrange }]}>Complete!</Text>
                )}

                {/* Stop button (yellow) */}
                <Pressable style={styles.stopButton} onPress={stopTimer}>
                    <Text style={styles.stopButtonText}>STOP</Text>
                </Pressable>
            </View>
        );
    }

    // Normal Mode UI (app background with presets)
    return (
        <View style={styles.container}>
            {/* Title */}
            <Text style={styles.title}>VOID FOCUS</Text>
            <Text style={styles.subtitle}>Deep work timer</Text>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
                <Text style={styles.timer}>{formatTime(remainingSeconds)}</Text>
            </View>

            {/* Presets */}
            <View style={styles.presetsContainer}>
                {PRESETS.map((mins) => (
                    <Pressable
                        key={mins}
                        style={[
                            styles.presetButton,
                            selectedMinutes === mins && styles.presetButtonActive
                        ]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setSelectedMinutes(mins);
                        }}
                    >
                        <Text style={[
                            styles.presetText,
                            selectedMinutes === mins && styles.presetTextActive
                        ]}>{mins}m</Text>
                    </Pressable>
                ))}
            </View>

            {/* Start Button */}
            <Pressable style={styles.startButton} onPress={startTimer}>
                <Text style={styles.startButtonText}>START</Text>
            </Pressable>

            {/* Spacer for VoidDock */}
            <View style={{ height: 140 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    // Normal mode styles
    container: {
        flex: 1,
        backgroundColor: COLORS.voidBlue,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.xl,
        color: COLORS.mist,
        letterSpacing: 4,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.bioOrange,
        opacity: 0.7,
        letterSpacing: 2,
        marginBottom: 60,
    },
    timerContainer: {
        marginBottom: 40,
    },
    timer: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: 80,
        color: COLORS.mist,
        letterSpacing: 4,
    },
    presetsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 48,
    },
    presetButton: {
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    presetButtonActive: {
        backgroundColor: COLORS.bioOrange,
        borderColor: COLORS.bioOrange,
    },
    presetText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.base,
        color: COLORS.mist,
    },
    presetTextActive: {
        color: COLORS.voidBlue,
        fontWeight: 'bold',
    },
    startButton: {
        backgroundColor: COLORS.bioOrange,
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 30,
    },
    startButtonText: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.voidBlue,
        letterSpacing: 3,
    },

    // Focus mode styles
    focusContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: OLED_BLACK,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    circleContainer: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleSvg: {
        position: 'absolute',
    },
    circleContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    inCircleTimer: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: 20,
        color: GRAY_TEXT,
        letterSpacing: 2,
        marginTop: 16,
    },
    statusText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
        opacity: 0.4,
        letterSpacing: 1,
        marginTop: 40,
    },
    stopButton: {
        position: 'absolute',
        bottom: 80,
        backgroundColor: COLORS.bioOrange,
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    stopButtonText: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.base,
        color: COLORS.voidBlue,
        letterSpacing: 3,
    },
});
