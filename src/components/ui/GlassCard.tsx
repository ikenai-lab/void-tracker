import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../../theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, onPress }) => {
    const Container = onPress ? Pressable : View;

    return (
        <Container
            style={[styles.card, style]}
            onPress={onPress}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(5, 38, 51, 0.5)', // Semi-transparent Void Blue
        borderColor: 'rgba(238, 238, 238, 0.05)', // Subtle white border
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
    },
});
