/**
 * Sound Manager
 * 
 * Handles audio feedback for habit completion and focus timer.
 * Uses expo-av for audio playback.
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Sound object cache
let habitSound: Audio.Sound | null = null;
let focusSound: Audio.Sound | null = null;

// Local sound files
const HABIT_SOUND = require('../../assets/sounds/set-unset-habit.wav');
const FOCUS_SOUND = require('../../assets/sounds/mixkit-sleepy-cat-135.mp3');

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
                staysActiveInBackground: true, // Keep playing in background for focus timer
                shouldDuckAndroid: true,
            });

            // Preload habit completion sound
            const { sound: hSound } = await Audio.Sound.createAsync(
                HABIT_SOUND,
                { shouldPlay: false, volume: 0.6 }
            );
            habitSound = hSound;

            // Preload focus timer sound
            const { sound: fSound } = await Audio.Sound.createAsync(
                FOCUS_SOUND,
                { shouldPlay: false, volume: 0.4, isLooping: true }
            );
            focusSound = fSound;

            console.log('[SoundManager] Sounds preloaded');
        } catch (error) {
            console.warn('[SoundManager] Failed to preload sounds:', error);
        }
    },

    /**
     * Play the habit toggle sound (complete/uncomplete)
     */
    playHabitSound: async (): Promise<void> => {
        try {
            if (!habitSound) {
                // Lazy load if not preloaded
                const { sound } = await Audio.Sound.createAsync(
                    HABIT_SOUND,
                    { shouldPlay: true, volume: 0.6 }
                );
                habitSound = sound;
                return;
            }

            // Rewind and play
            await habitSound.setPositionAsync(0);
            await habitSound.playAsync();
        } catch (error) {
            console.warn('[SoundManager] Failed to play habit sound:', error);
        }
    },

    /**
     * Start playing focus timer ambient sound (loops)
     */
    playFocusSound: async (): Promise<void> => {
        try {
            if (!focusSound) {
                // Lazy load if not preloaded
                const { sound } = await Audio.Sound.createAsync(
                    FOCUS_SOUND,
                    { shouldPlay: true, volume: 0.4, isLooping: true }
                );
                focusSound = sound;
                return;
            }

            // Set to loop and play from start
            await focusSound.setIsLoopingAsync(true);
            await focusSound.setPositionAsync(0);
            await focusSound.playAsync();
        } catch (error) {
            console.warn('[SoundManager] Failed to play focus sound:', error);
        }
    },

    /**
     * Stop the focus timer sound
     */
    stopFocusSound: async (): Promise<void> => {
        try {
            if (focusSound) {
                await focusSound.stopAsync();
            }
        } catch (error) {
            console.warn('[SoundManager] Failed to stop focus sound:', error);
        }
    },

    /**
     * Check if focus sound is currently playing
     */
    isFocusSoundPlaying: async (): Promise<boolean> => {
        try {
            if (focusSound) {
                const status = await focusSound.getStatusAsync();
                return status.isLoaded && status.isPlaying;
            }
            return false;
        } catch {
            return false;
        }
    },

    /**
     * Cleanup - call when app unmounts
     */
    unload: async (): Promise<void> => {
        try {
            if (habitSound) {
                await habitSound.unloadAsync();
                habitSound = null;
            }
            if (focusSound) {
                await focusSound.stopAsync();
                await focusSound.unloadAsync();
                focusSound = null;
            }
            console.log('[SoundManager] Sounds unloaded');
        } catch (error) {
            console.warn('[SoundManager] Failed to unload sounds:', error);
        }
    },
};
