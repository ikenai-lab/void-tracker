/**
 * Sound Manager
 * 
 * Handles audio feedback for habit completion.
 * Uses expo-av for audio playback.
 * 
 * Provides a satisfying "thock" or click sound when marking habits complete.
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Sound object cache
let completionSound: Audio.Sound | null = null;

// A short "pop" sound from Mixkit (royalty-free)
const COMPLETION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';

export const SoundManager = {
    /**
     * Initialize and preload sounds
     * Call this once at app startup for instant playback
     */
    preload: async (): Promise<void> => {
        try {
            // Configure audio mode for best experience
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: false, // Respect silent mode
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            // Preload completion sound
            const { sound } = await Audio.Sound.createAsync(
                { uri: COMPLETION_SOUND_URL },
                { shouldPlay: false, volume: 0.5 }
            );
            completionSound = sound;

            console.log('[SoundManager] Sounds preloaded');
        } catch (error) {
            console.warn('[SoundManager] Failed to preload sounds:', error);
        }
    },

    /**
     * Play the habit completion sound
     * A short, satisfying "pop" or "thock"
     */
    playCompletionSound: async (): Promise<void> => {
        try {
            if (!completionSound) {
                // Lazy load if not preloaded
                const { sound } = await Audio.Sound.createAsync(
                    { uri: COMPLETION_SOUND_URL },
                    { shouldPlay: true, volume: 0.5 }
                );
                completionSound = sound;
                return;
            }

            // Rewind and play
            await completionSound.setPositionAsync(0);
            await completionSound.playAsync();
        } catch (error) {
            console.warn('[SoundManager] Failed to play completion sound:', error);
        }
    },

    /**
     * Play the habit uncomplete sound (softer, reverse feedback)
     */
    playUncompleteSound: async (): Promise<void> => {
        // For now, we just don't play a sound on uncomplete
        // Could add a softer "click" sound here later
    },

    /**
     * Cleanup - call when app unmounts
     */
    unload: async (): Promise<void> => {
        try {
            if (completionSound) {
                await completionSound.unloadAsync();
                completionSound = null;
            }
            console.log('[SoundManager] Sounds unloaded');
        } catch (error) {
            console.warn('[SoundManager] Failed to unload sounds:', error);
        }
    },
};
