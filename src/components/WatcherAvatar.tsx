/**
 * WatcherAvatar - The Passive Companion
 * 
 * A minimalist spirit avatar that watches over your progress.
 * Features mood-based expressions and random blinking.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../theme';

interface WatcherAvatarProps {
    completionPercentage: number; // 0-100
    size?: number;
}

// Colors
const AVATAR_BODY_COLOR = '#052633'; // Slightly lighter than Void Blue
const EYE_COLOR = COLORS.bioOrange;

// Animation constants
const BLINK_DURATION = 150;
const BLINK_MIN_INTERVAL = 4000;
const BLINK_MAX_INTERVAL = 8000;

type Mood = 'sleepy' | 'alert' | 'happy';

export const WatcherAvatar: React.FC<WatcherAvatarProps> = ({
    completionPercentage,
    size = 80,
}) => {
    // Blink animation value (1 = open, 0 = closed)
    const leftEyeScale = useSharedValue(1);
    const rightEyeScale = useSharedValue(1);
    const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Determine mood based on completion
    const getMood = (): Mood => {
        if (completionPercentage >= 100) return 'happy';
        if (completionPercentage >= 50) return 'alert';
        return 'sleepy';
    };

    const mood = getMood();

    // Random blink function - web-compatible (no withSequence)
    const triggerBlink = useCallback(() => {
        // Close eyes
        leftEyeScale.value = withTiming(0.1, {
            duration: BLINK_DURATION,
            easing: Easing.out(Easing.quad)
        });
        rightEyeScale.value = withTiming(0.1, {
            duration: BLINK_DURATION,
            easing: Easing.out(Easing.quad)
        });

        // Schedule eye open after close animation
        setTimeout(() => {
            leftEyeScale.value = withTiming(1, {
                duration: BLINK_DURATION,
                easing: Easing.in(Easing.quad)
            });
            rightEyeScale.value = withTiming(1, {
                duration: BLINK_DURATION,
                easing: Easing.in(Easing.quad)
            });
        }, BLINK_DURATION);
    }, [leftEyeScale, rightEyeScale]);

    // Schedule next blink with random interval
    const scheduleNextBlink = useCallback(() => {
        const interval = Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL) + BLINK_MIN_INTERVAL;

        blinkTimeoutRef.current = setTimeout(() => {
            triggerBlink();
            scheduleNextBlink();
        }, interval);
    }, [triggerBlink]);

    // Start blinking on mount
    useEffect(() => {
        scheduleNextBlink();
        return () => {
            if (blinkTimeoutRef.current) {
                clearTimeout(blinkTimeoutRef.current);
            }
        };
    }, [scheduleNextBlink]);

    // Animated eye styles
    const leftEyeStyle = useAnimatedStyle(() => ({
        transform: [{ scaleY: leftEyeScale.value }],
    }));

    const rightEyeStyle = useAnimatedStyle(() => ({
        transform: [{ scaleY: rightEyeScale.value }],
    }));

    // Eye configuration based on mood
    const getEyeHeight = (): number => {
        switch (mood) {
            case 'happy':
                return 0; // Will use crescents instead
            case 'alert':
                return 8;
            case 'sleepy':
            default:
                return 4;
        }
    };

    const getEyeYOffset = (): number => {
        return mood === 'sleepy' ? 2 : 0;
    };

    const eyeHeight = getEyeHeight();
    const eyeYOffset = getEyeYOffset();
    const scale = size / 80;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox="0 0 80 80">
                {/* Body - A rounded blob/spirit shape */}
                <Path
                    d="M 40 70 C 20 70, 10 55, 10 40 C 10 25, 20 15, 30 12 C 32 8, 35 5, 40 5 C 45 5, 48 8, 50 12 C 60 15, 70 25, 70 40 C 70 55, 60 70, 40 70 Z"
                    fill={AVATAR_BODY_COLOR}
                />

                {/* Left ear */}
                <Path
                    d="M 18 28 C 12 20, 8 12, 15 8 C 22 6, 26 14, 25 22"
                    fill={AVATAR_BODY_COLOR}
                />

                {/* Right ear */}
                <Path
                    d="M 62 28 C 68 20, 72 12, 65 8 C 58 6, 54 14, 55 22"
                    fill={AVATAR_BODY_COLOR}
                />

                {/* Happy eyes: crescents ^ ^ */}
                {mood === 'happy' && (
                    <>
                        <Path
                            d="M 28 38 Q 32 32, 36 38"
                            stroke={EYE_COLOR}
                            strokeWidth={3}
                            strokeLinecap="round"
                            fill="none"
                        />
                        <Path
                            d="M 44 38 Q 48 32, 52 38"
                            stroke={EYE_COLOR}
                            strokeWidth={3}
                            strokeLinecap="round"
                            fill="none"
                        />
                    </>
                )}
            </Svg>

            {/* Animated eyes (for sleepy and alert moods) */}
            {mood !== 'happy' && (
                <>
                    <Animated.View
                        style={[
                            styles.animatedEye,
                            {
                                left: 27 * scale,
                                top: (34 + eyeYOffset) * scale,
                                width: 10 * scale,
                                height: eyeHeight * scale,
                                borderRadius: 5 * scale,
                            },
                            leftEyeStyle,
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.animatedEye,
                            {
                                left: 43 * scale,
                                top: (34 + eyeYOffset) * scale,
                                width: 10 * scale,
                                height: eyeHeight * scale,
                                borderRadius: 5 * scale,
                            },
                            rightEyeStyle,
                        ]}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    animatedEye: {
        position: 'absolute',
        backgroundColor: EYE_COLOR,
    },
});

export default WatcherAvatar;
