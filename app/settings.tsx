/**
 * Settings Screen
 * 
 * Simple settings page for app configuration.
 * Using GlassCard for consistent UI.
 */

import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { Moon, Bell, Trash2, Info } from 'lucide-react-native';

import { COLORS, TYPOGRAPHY } from '../src/theme';
import { GlassCard } from '../src/components';

interface SettingRowProps {
    icon: typeof Moon;
    label: string;
    description?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    isLast?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
    icon: Icon,
    label,
    description,
    rightElement,
    onPress,
    isLast,
}) => (
    <Pressable
        style={[styles.settingRow, isLast && styles.settingRowLast]}
        onPress={onPress}
        disabled={!onPress}
    >
        <View style={styles.settingIcon}>
            <Icon size={20} color={COLORS.mist} strokeWidth={1.5} />
        </View>
        <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{label}</Text>
            {description && (
                <Text style={styles.settingDescription}>{description}</Text>
            )}
        </View>
        {rightElement && <View style={styles.settingRight}>{rightElement}</View>}
    </Pressable>
);

export default function SettingsScreen() {
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>SETTINGS</Text>
                <Text style={styles.subtitle}>Customize your void</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Preferences Group */}
            <Text style={styles.groupTitle}>Preferences</Text>
            <GlassCard style={styles.settingsCard}>
                <SettingRow
                    icon={Bell}
                    label="Notifications"
                    description="Get notified to check in"
                    rightElement={
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#333', true: COLORS.bioOrange }}
                            thumbColor={COLORS.mist}
                        />
                    }
                />

                <SettingRow
                    icon={Moon}
                    label="Dark Mode"
                    description="Always on by design"
                    isLast
                    rightElement={
                        <Text style={styles.settingValue}>Always</Text>
                    }
                />
            </GlassCard>

            {/* Data Group */}
            <Text style={styles.groupTitle}>Data</Text>
            <GlassCard style={styles.settingsCard}>
                <SettingRow
                    icon={Trash2}
                    label="Clear All Data"
                    description="Reset all habits and history"
                    isLast
                    onPress={() => console.log('Clear data')}
                />
            </GlassCard>

            {/* About Group */}
            <Text style={styles.groupTitle}>About</Text>
            <GlassCard style={styles.settingsCard}>
                <SettingRow
                    icon={Info}
                    label="Version"
                    description="Void Tracker"
                    isLast
                    rightElement={
                        <Text style={styles.settingValue}>1.0.0</Text>
                    }
                />
            </GlassCard>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Made with 🧡 in the void
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    header: {
        marginBottom: 8,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.xl,
        color: COLORS.mist,
        letterSpacing: 3,
    },
    subtitle: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.bioOrange,
        letterSpacing: 1,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.mist,
        opacity: 0.1,
        marginVertical: 16,
    },
    groupTitle: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        opacity: 0.4,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: 8,
    },
    settingsCard: {
        padding: 0, // Override GlassCard padding
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(238, 238, 238, 0.05)',
    },
    settingRowLast: {
        borderBottomWidth: 0,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    settingContent: {
        flex: 1,
    },
    settingLabel: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.base,
        color: COLORS.mist,
    },
    settingDescription: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        opacity: 0.4,
        marginTop: 2,
    },
    settingRight: {
        marginLeft: 12,
    },
    settingValue: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
        opacity: 0.5,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    footerText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        opacity: 0.3,
    },
});
