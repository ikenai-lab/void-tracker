/**
 * Focus Store
 * 
 * Simple store to track focus mode state across components.
 * Used to hide VoidDock when in focus mode.
 */

import { create } from 'zustand';

interface FocusState {
    isFocusMode: boolean;
    setFocusMode: (active: boolean) => void;
}

export const useFocusStore = create<FocusState>((set) => ({
    isFocusMode: false,
    setFocusMode: (active: boolean) => set({ isFocusMode: active }),
}));
