/**
 * Void Dock
 * 
 * Glass Capsule bottom navigation bar.
 * Hidden when on focus screen in focus mode.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Settings, Plus, Home, Timer } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COLORS } from '../theme';
import { CreateHabitSheet } from './CreateHabitSheet';
import { useFocusStore } from '../stores';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const VoidDock: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    // Check if we're in focus mode
    const isFocusMode = useFocusStore(state => state.isFocusMode);

    const isHome = pathname === '/';
    const isFocus = pathname === '/focus';

    // Hide dock when in focus mode
    if (isFocus && isFocusMode) {
        return null;
    }

    const handleManifestPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSheetVisible(true);
    };

    const handleLeftButtonPress = () => {
        Haptics.selectionAsync();
        if (isHome) {
            // On homepage, go to settings
            router.push('/settings');
        } else {
            // On any other page, go home
            router.replace('/');
        }
    };

    const handleFocusPress = () => {
        Haptics.selectionAsync();
        if (!isFocus) {
            router.push('/focus');
        }
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.capsule}>
                    {/* Left: Settings (on home) or Home (elsewhere) */}
                    <Pressable
                        style={styles.iconButton}
                        onPress={handleLeftButtonPress}
                    >
                        {isHome ? (
                            <Settings size={24} color={COLORS.mist} strokeWidth={2} />
                        ) : (
                            <Home size={24} color={COLORS.mist} strokeWidth={2} />
                        )}
                    </Pressable>

                    {/* Center: Add Button */}
                    <Pressable
                        style={styles.addButton}
                        onPress={handleManifestPress}
                    >
                        <Plus size={28} color={COLORS.voidBlue} strokeWidth={3} />
                    </Pressable>

                    {/* Right: Focus Timer */}
                    <Pressable
                        style={styles.iconButton}
                        onPress={handleFocusPress}
                    >
                        <Timer
                            size={24}
                            color={isFocus ? COLORS.bioOrange : COLORS.mist}
                            strokeWidth={2}
                        />
                    </Pressable>
                </View>
            </View>

            {/* Creation Sheet */}
            <CreateHabitSheet
                visible={isSheetVisible}
                onClose={() => setIsSheetVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    capsule: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: SCREEN_WIDTH * 0.6,
        height: 70,
        backgroundColor: 'rgba(2, 26, 36, 0.9)',
        borderRadius: 35,
        borderWidth: 1,
        borderColor: 'rgba(255, 179, 71, 0.15)',
        paddingHorizontal: 20,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.bioOrange,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
