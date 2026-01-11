/**
 * Root Layout - Persistent Atmospheric Shell
 * 
 * This layout wraps all screens with the "Void & Vapor" atmosphere.
 * The GrainOverlay and DawnGradient are placed here to prevent
 * flickering during navigation.
 * 
 * Features splash screen control and custom font loading.
 */

import '../global.css';

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
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
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';

import { GrainOverlay, VoidDock } from '../src/components';
import { COLORS, ANIMATION } from '../src/theme';
import { initializeDatabase } from '../src/db';
import { useFocusStore } from '../src/stores/useFocusStore';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        SpaceMono_400Regular,
        SpaceMono_700Bold,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
    });

    const [dbReady, setDbReady] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);
    const [appIsReady, setAppIsReady] = useState(false);
    const insets = useSafeAreaInsets();

    // Check if focus mode is active to change background
    const isFocusMode = useFocusStore(state => state.isFocusMode);

    // Animation values for the Void Card entrance
    const cardOpacity = useSharedValue(0);
    const cardScale = useSharedValue(0.95);

    // Initialize database on mount
    useEffect(() => {
        const init = async () => {
            try {
                await initializeDatabase();
                setDbReady(true);
            } catch (error) {
                console.error('[Layout] Database initialization failed:', error);
                setDbError(error instanceof Error ? error.message : 'Database error');
            }
        };

        init();
    }, []);

    // Check if app is ready (fonts loaded + DB ready)
    useEffect(() => {
        if (fontsLoaded && dbReady) {
            setAppIsReady(true);
        }
    }, [fontsLoaded, dbReady]);

    // Hide splash screen when app is ready
    const onLayoutRootView = useCallback(async () => {
        if (appIsReady) {
            // Hide splash screen
            await SplashScreen.hideAsync();

            // Trigger entrance animation
            cardOpacity.value = withTiming(1, {
                duration: ANIMATION.duration.slow,
                easing: Easing.out(Easing.cubic),
            });
            cardScale.value = withTiming(1, {
                duration: ANIMATION.duration.slow,
                easing: Easing.out(Easing.cubic),
            });
        }
    }, [appIsReady]);

    // Animated styles for the Void Card
    const animatedCardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [{ scale: cardScale.value }],
    }));

    // Don't render until app is ready
    if (!appIsReady) {
        return null;
    }

    // Show error state
    if (dbError || fontError) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar style="light" translucent backgroundColor="transparent" />
                <Text style={styles.errorText}>Error</Text>
                <Text style={styles.errorDetail}>
                    {dbError || fontError?.message || 'Unknown error'}
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <View style={[styles.container, isFocusMode && { backgroundColor: '#000000' }]} onLayout={onLayoutRootView}>
                {/* Light status bar for dark background */}
                <StatusBar style="light" translucent backgroundColor={isFocusMode ? '#000000' : 'transparent'} />

                {/* Dawn Gradient Background - Hidden in focus mode */}
                {!isFocusMode && (
                    <LinearGradient
                        colors={['#e0f7fa', '#fbe9e7']}
                        style={styles.gradientBackground}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    />
                )}

                {/* Content */}
                <View style={[
                    styles.voidCard,
                    { paddingTop: isFocusMode ? 0 : insets.top, paddingBottom: isFocusMode ? 0 : insets.bottom },
                    isFocusMode && { backgroundColor: '#000000' }
                ]}>
                    <View style={styles.safeArea}>
                        <Slot />
                    </View>

                    {/* Grain overlay - hidden in focus mode */}
                    {!isFocusMode && <GrainOverlay />}
                </View>

                {/* VoidDock - Floating navigation */}
                <VoidDock />
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.voidBlue,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.voidBlue,
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
    gradientBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    voidCard: {
        flex: 1,
        backgroundColor: COLORS.voidBlue,
    },
    safeArea: {
        flex: 1,
    },
    screenContent: {
        flex: 1,
        padding: 24,
    },
});
