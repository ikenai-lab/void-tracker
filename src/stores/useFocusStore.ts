/**
 * Focus Store
 * 
 * Simple store to track focus mode state across components.
 * Used to hide VoidDock when in focus mode.
 * Also stores user preference for focus timer sound.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FocusState {
    isFocusMode: boolean;
    soundEnabled: boolean;
    setFocusMode: (active: boolean) => void;
    setSoundEnabled: (enabled: boolean) => void;
    toggleSound: () => void;
}

export const useFocusStore = create<FocusState>()(
    persist(
        (set, get) => ({
            isFocusMode: false,
            soundEnabled: true, // Default: sound on
            setFocusMode: (active: boolean) => set({ isFocusMode: active }),
            setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
            toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
        }),
        {
            name: 'focus-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ soundEnabled: state.soundEnabled }), // Only persist sound preference
        }
    )
);
