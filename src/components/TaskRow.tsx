/**
 * TaskRow - Interactive habit row with "Ignition" animation
 * 
 * The entire row is tappable - no checkbox needed.
 * When completed, the icon ignites with a bioluminescent glow
 * before settling into a dim completed state.
 */

import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import * as LucideIcons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, ANIMATION } from '../theme';

interface TaskRowProps {
    title: string;
    iconKey: string;
    isCompleted: boolean;
    onToggle: () => void;
}

// Animation constants following Void & Vapor principles (600ms+, eased)
const IGNITION_DURATION = 600;
const SETTLE_DURATION = 800;
const SETTLE_DELAY = 600;

// Create animated versions of components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Map of icon keys to Lucide components
const getIconComponent = (key: string): React.ComponentType<LucideIcons.LucideProps> => {
    // Convert kebab-case or snake_case to PascalCase
    const pascalKey = key
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

    // Try to get the icon, fallback to Circle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lucideModule = LucideIcons as any;
    const IconComponent = lucideModule[pascalKey];
    return IconComponent || LucideIcons.Circle;
};


export const TaskRow: React.FC<TaskRowProps> = ({
    title,
    iconKey,
    isCompleted,
    onToggle,
}) => {
    // Track previous completion state to determine direction of toggle
    const wasCompletedRef = useRef(isCompleted);
    // Animation values
    const iconScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(isCompleted ? 0.3 : 0.9);
    const strikethroughWidth = useSharedValue(isCompleted ? 100 : 0);

    // For icon color animation - 0: white, 1: orange, 2: grey
    const iconWhiteOpacity = useSharedValue(isCompleted ? 0 : 1);
    const iconOrangeOpacity = useSharedValue(0);
    const iconGreyOpacity = useSharedValue(isCompleted ? 1 : 0);

    // Get the Lucide icon component
    const IconComponent = getIconComponent(iconKey);

    useEffect(() => {
        if (isCompleted) {
            // IGNITION SEQUENCE - Web-compatible (no withSequence)

            // 1. Icon scales up first
            iconScale.value = withTiming(1.2, {
                duration: IGNITION_DURATION,
                easing: Easing.out(Easing.cubic)
            });

            // Schedule scale down after ignition + settle delay
            const scaleTimer = setTimeout(() => {
                iconScale.value = withTiming(1, {
                    duration: SETTLE_DURATION,
                    easing: Easing.inOut(Easing.cubic)
                });
            }, IGNITION_DURATION + SETTLE_DELAY);

            // White fades out
            iconWhiteOpacity.value = withTiming(0, {
                duration: IGNITION_DURATION / 2,
                easing: Easing.out(Easing.cubic)
            });

            // Orange fades in first
            iconOrangeOpacity.value = withTiming(1, {
                duration: IGNITION_DURATION,
                easing: Easing.out(Easing.cubic)
            });

            // Schedule orange fade out
            const orangeTimer = setTimeout(() => {
                iconOrangeOpacity.value = withTiming(0, {
                    duration: SETTLE_DURATION,
                    easing: Easing.inOut(Easing.cubic)
                });
            }, IGNITION_DURATION + SETTLE_DELAY);

            // Grey fades in after orange
            iconGreyOpacity.value = withDelay(
                IGNITION_DURATION + SETTLE_DELAY,
                withTiming(1, {
                    duration: SETTLE_DURATION,
                    easing: Easing.inOut(Easing.cubic)
                })
            );

            // Glow: 0 -> 1 first
            glowOpacity.value = withTiming(1, {
                duration: IGNITION_DURATION,
                easing: Easing.out(Easing.cubic)
            });

            // Schedule glow fade out
            const glowTimer = setTimeout(() => {
                glowOpacity.value = withTiming(0, {
                    duration: SETTLE_DURATION,
                    easing: Easing.inOut(Easing.cubic)
                });
            }, IGNITION_DURATION + SETTLE_DELAY);

            // Text fades to 0.3
            textOpacity.value = withTiming(0.3, {
                duration: IGNITION_DURATION,
                easing: Easing.out(Easing.cubic)
            });

            // Strikethrough grows
            strikethroughWidth.value = withTiming(100, {
                duration: IGNITION_DURATION * 1.5,
                easing: Easing.out(Easing.cubic)
            });
        } else {
            // RESET - Un-completing (slow, 600ms+ as per spec)
            iconScale.value = withTiming(1, {
                duration: ANIMATION.duration.normal,
                easing: Easing.inOut(Easing.cubic)
            });

            iconWhiteOpacity.value = withTiming(1, {
                duration: ANIMATION.duration.normal,
                easing: Easing.inOut(Easing.cubic)
            });

            iconOrangeOpacity.value = withTiming(0, {
                duration: ANIMATION.duration.normal,
                easing: Easing.inOut(Easing.cubic)
            });

            iconGreyOpacity.value = withTiming(0, {
                duration: ANIMATION.duration.normal,
                easing: Easing.inOut(Easing.cubic)
            });

            glowOpacity.value = withTiming(0, {
                duration: ANIMATION.duration.normal,
                easing: Easing.inOut(Easing.cubic)
            });

            textOpacity.value = withTiming(0.9, {
                duration: ANIMATION.duration.normal,
                easing: Easing.inOut(Easing.cubic)
            });

            strikethroughWidth.value = withTiming(0, {
                duration: ANIMATION.duration.normal,
                easing: Easing.inOut(Easing.cubic)
            });
        }
    }, [isCompleted]);

    // Animated icon container style
    const animatedIconContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    // Animated glow style
    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: iconScale.value }],
    }));

    // Animated text style
    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    // Animated strikethrough
    const animatedStrikethroughStyle = useAnimatedStyle(() => ({
        width: `${strikethroughWidth.value}%`,
    }));

    // Animated icon layer styles
    const animatedWhiteStyle = useAnimatedStyle(() => ({
        opacity: iconWhiteOpacity.value,
    }));

    const animatedOrangeStyle = useAnimatedStyle(() => ({
        opacity: iconOrangeOpacity.value,
    }));

    const animatedGreyStyle = useAnimatedStyle(() => ({
        opacity: iconGreyOpacity.value,
    }));

    // Handle toggle with haptic feedback
    const handleToggle = async () => {
        // Trigger appropriate haptic feedback based on direction
        if (Platform.OS !== 'web') {
            try {
                if (!isCompleted) {
                    // Completing a task - heavy impact for satisfying feedback
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                } else {
                    // Uncompleting a task - light impact
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            } catch (error) {
                // Haptics not available (e.g., some web browsers)
                console.log('[TaskRow] Haptics not available');
            }
        }

        // Call the actual toggle handler
        onToggle();
    };

    return (
        <AnimatedPressable
            style={styles.container}
            onPress={handleToggle}
            android_ripple={{ color: 'rgba(255, 179, 71, 0.1)' }}
        >
            {/* Icon with glow effect */}
            <View style={styles.iconContainer}>
                {/* Glow layer (behind the icon) */}
                <Animated.View style={[styles.iconGlow, animatedGlowStyle]} />

                {/* The actual icon - multiple color layers */}
                <Animated.View style={[styles.iconWrapper, animatedIconContainerStyle]}>
                    {/* White layer (default state) */}
                    <Animated.View style={[styles.iconLayer, animatedWhiteStyle]}>
                        <IconComponent size={24} color={COLORS.mist} strokeWidth={1.5} />
                    </Animated.View>

                    {/* Orange layer (ignition state) */}
                    <Animated.View style={[styles.iconLayer, styles.iconLayerAbsolute, animatedOrangeStyle]}>
                        <IconComponent size={24} color={COLORS.bioOrange} strokeWidth={1.5} />
                    </Animated.View>

                    {/* Grey layer (settled/completed state) */}
                    <Animated.View style={[styles.iconLayer, styles.iconLayerAbsolute, animatedGreyStyle]}>
                        <IconComponent size={24} color="#666666" strokeWidth={1.5} />
                    </Animated.View>
                </Animated.View>
            </View>

            {/* Text with strikethrough */}
            <View style={styles.textContainer}>
                <Animated.Text style={[styles.title, animatedTextStyle]}>
                    {title}
                </Animated.Text>

                {/* Strikethrough line */}
                <Animated.View style={[styles.strikethrough, animatedStrikethroughStyle]} />
            </View>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconWrapper: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconLayer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconLayerAbsolute: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    iconGlow: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.bioOrange,
        shadowColor: COLORS.bioOrange,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 16,
        elevation: 8,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        position: 'relative',
    },
    title: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: COLORS.mist,
        letterSpacing: 0.3,
    },
    strikethrough: {
        position: 'absolute',
        left: 0,
        top: '50%',
        height: 1,
        backgroundColor: COLORS.mist,
        opacity: 0.3,
    },
});

export default TaskRow;
