/**
 * Void & Vapor Design System
 * 
 * The atmospheric, lo-fi minimalist aesthetic for Void Tracker.
 * Colors, typography, and spacing constants.
 */

export const COLORS = {
    // Primary palette
    voidBlue: '#021a24',      // The deep, infinite teal/black
    bioOrange: '#ffb347',      // Bioluminescent accent - eyes, active states, glows
    mist: '#eeeeee',           // Off-white for text

    // Dawn Gradient
    dawnCyan: '#e0f7fa',       // Top of gradient
    dawnPeach: '#fbe9e7',      // Bottom of gradient

    // Utility colors
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
} as const;

export const BORDER_RADIUS = {
    sm: 8,
    md: 16,
    lg: 24,
    organic: 32,    // The signature pill-like curves
    full: 9999,
} as const;

export const TYPOGRAPHY = {
    // Font families (loaded via expo-font)
    fonts: {
        mono: 'SpaceMono_400Regular',
        monoBold: 'SpaceMono_700Bold',
        sans: 'Inter_400Regular',
        sansMedium: 'Inter_500Medium',
        sansSemibold: 'Inter_600SemiBold',
    },
    // Font sizes
    sizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 24,
        '2xl': 32,
        '3xl': 48,
    },
} as const;

export const ANIMATION = {
    // All animations are slow and fluid (600ms+)
    duration: {
        fast: 300,      // Only for micro-interactions
        normal: 600,    // Standard transitions
        slow: 900,      // Emphasis animations
        glacial: 1200,  // Entrance/exit animations
    },
} as const;

export const SHADOWS = {
    // For the void card - large, diffuse, soft
    card: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    // Subtle glow for active elements
    glow: {
        shadowColor: '#ffb347',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
} as const;
