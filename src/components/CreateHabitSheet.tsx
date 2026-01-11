/**
 * Create Habit Sheet
 * 
 * Bottom sheet modal for creating new habits.
 * Supports both "Build" (positive) and "Break" (negative) habits.
 * Includes "Protocols" - preset bundles of habits.
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput, Pressable,
    Switch, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Check, Plus, Minus, Sparkles, Brain, Dumbbell, Eye, ChevronRight } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { useHabitStore } from '../stores';
import { NotificationManager } from '../utils/NotificationManager';

// Selected set of icons for the picker
const ICONS = ['Circle', 'CheckCircle', 'Zap', 'Brain', 'Book', 'Dumbbell', 'Droplets', 'Coffee', 'Code', 'Music', 'Sun', 'Moon', 'Star', 'Heart', 'Smile'];

// Crimson color for negative habits
const CRIMSON = '#ff4d4d';

// Protocol type definition
interface Protocol {
    id: string;
    name: string;
    description: string;
    icon: 'Brain' | 'Dumbbell' | 'Eye';
    color: string;
    habits: Array<{
        title: string;
        iconKey: string;
        type: 'positive' | 'negative';
    }>;
}

// Protocols data
const PROTOCOLS: Protocol[] = [
    {
        id: 'monk',
        name: 'The Monk',
        description: 'Inner peace and focus',
        icon: 'Brain',
        color: '#9b59b6', // Purple
        habits: [
            { title: 'Meditate', iconKey: 'Brain', type: 'positive' },
            { title: 'Read', iconKey: 'Book', type: 'positive' },
            { title: 'No Social Media', iconKey: 'Zap', type: 'negative' },
        ],
    },
    {
        id: 'titan',
        name: 'The Titan',
        description: 'Physical excellence',
        icon: 'Dumbbell',
        color: '#e74c3c', // Red
        habits: [
            { title: 'Workout', iconKey: 'Dumbbell', type: 'positive' },
            { title: '8h Sleep', iconKey: 'Moon', type: 'positive' },
            { title: 'Hit Protein Goal', iconKey: 'Droplets', type: 'positive' },
        ],
    },
    {
        id: 'detox',
        name: 'The Dopamine Detox',
        description: 'Reset your reward system',
        icon: 'Eye',
        color: '#27ae60', // Green
        habits: [
            { title: 'No Sugar', iconKey: 'Coffee', type: 'negative' },
            { title: 'No Doomscrolling', iconKey: 'Zap', type: 'negative' },
            { title: 'Walk 30 min', iconKey: 'Sun', type: 'positive' },
        ],
    },
];

interface CreateHabitSheetProps {
    visible: boolean;
    onClose: () => void;
}

type TabType = 'create' | 'protocols';

export const CreateHabitSheet: React.FC<CreateHabitSheetProps> = ({ visible, onClose }) => {
    const { addHabit } = useHabitStore();

    // Tab State
    const [activeTab, setActiveTab] = useState<TabType>('create');

    // Form State
    const [title, setTitle] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Circle');
    const [habitType, setHabitType] = useState<'positive' | 'negative'>('positive');
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState(new Date());
    const [showAndroidPicker, setShowAndroidPicker] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (visible) {
            setActiveTab('create');
            setTitle('');
            setSelectedIcon('Circle');
            setHabitType('positive');
            setReminderEnabled(false);
            setReminderTime(new Date());
            setShowAndroidPicker(false);
        }
    }, [visible]);

    const handleSave = async () => {
        if (!title.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Color based on habit type
        const color = habitType === 'positive' ? COLORS.bioOrange : CRIMSON;

        // Format time string if enabled
        let timeStr: string | undefined;
        if (reminderEnabled) {
            const hasPerms = await NotificationManager.requestPermissions();
            if (hasPerms) {
                const hours = reminderTime.getHours();
                const minutes = reminderTime.getMinutes();
                timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                await NotificationManager.scheduleDailyReminder(
                    title,
                    "Time for the Void",
                    `Time to ${title}.`,
                    hours,
                    minutes
                );
            }
        }

        await addHabit(title, selectedIcon, color, timeStr, habitType);
        onClose();
    };

    // Handle Protocol Selection
    const handleProtocolSelect = async (protocol: Protocol) => {
        // Heavy haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Batch insert all habits from the protocol
        for (const habit of protocol.habits) {
            const color = habit.type === 'positive' ? COLORS.bioOrange : CRIMSON;
            await addHabit(habit.title, habit.iconKey, color, undefined, habit.type);
        }

        // Close modal
        onClose();
    };

    const getProtocolIcon = (iconName: string) => {
        switch (iconName) {
            case 'Brain': return Brain;
            case 'Dumbbell': return Dumbbell;
            case 'Eye': return Eye;
            default: return Sparkles;
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={onClose} />

                <Animated.View
                    entering={SlideInDown}
                    exiting={SlideOutDown}
                    style={styles.sheet}
                >
                    {/* Handle Bar */}
                    <View style={styles.handleBar} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>MANIFEST HABIT</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={COLORS.mist} />
                        </Pressable>
                    </View>

                    {/* Tab Switcher */}
                    <View style={styles.tabContainer}>
                        <Pressable
                            style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                            onPress={() => setActiveTab('create')}
                        >
                            <Plus size={16} color={activeTab === 'create' ? COLORS.voidBlue : COLORS.mist} />
                            <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>Create</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.tab, activeTab === 'protocols' && styles.tabActive]}
                            onPress={() => setActiveTab('protocols')}
                        >
                            <Sparkles size={16} color={activeTab === 'protocols' ? COLORS.voidBlue : COLORS.mist} />
                            <Text style={[styles.tabText, activeTab === 'protocols' && styles.tabTextActive]}>Protocols</Text>
                        </Pressable>
                    </View>

                    {/* Content based on tab */}
                    {activeTab === 'create' ? (
                        <>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Habit Type Toggle */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>HABIT TYPE</Text>
                                    <View style={styles.typeToggle}>
                                        <Pressable
                                            style={[
                                                styles.typeOption,
                                                habitType === 'positive' && styles.typeOptionActivePositive
                                            ]}
                                            onPress={() => setHabitType('positive')}
                                        >
                                            <Plus size={18} color={habitType === 'positive' ? COLORS.voidBlue : COLORS.mist} strokeWidth={3} />
                                            <Text style={[
                                                styles.typeOptionText,
                                                habitType === 'positive' && styles.typeOptionTextActive
                                            ]}>Build</Text>
                                        </Pressable>
                                        <Pressable
                                            style={[
                                                styles.typeOption,
                                                habitType === 'negative' && styles.typeOptionActiveNegative
                                            ]}
                                            onPress={() => setHabitType('negative')}
                                        >
                                            <Minus size={18} color={habitType === 'negative' ? COLORS.voidBlue : COLORS.mist} strokeWidth={3} />
                                            <Text style={[
                                                styles.typeOptionText,
                                                habitType === 'negative' && styles.typeOptionTextActiveNegative
                                            ]}>Break</Text>
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Name Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        {habitType === 'positive' ? 'WHAT WILL YOU DO?' : 'WHAT WILL YOU AVOID?'}
                                    </Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder={habitType === 'positive' ? "e.g. Read, Meditate..." : "e.g. Smoking, Sugar..."}
                                        placeholderTextColor="rgba(255, 255, 255, 0.2)"
                                        autoFocus
                                    />
                                </View>

                                {/* Icon Picker */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>CHOOSE A SYMBOL</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.iconList}
                                    >
                                        {ICONS.map(iconKey => {
                                            const IconComponent = (Icons as any)[iconKey];
                                            const isSelected = selectedIcon === iconKey;
                                            return (
                                                <Pressable
                                                    key={iconKey}
                                                    style={[
                                                        styles.iconOption,
                                                        isSelected && (habitType === 'positive' ? styles.iconOptionSelected : styles.iconOptionSelectedNegative)
                                                    ]}
                                                    onPress={() => setSelectedIcon(iconKey)}
                                                >
                                                    <IconComponent
                                                        size={24}
                                                        color={isSelected ? COLORS.voidBlue : COLORS.mist}
                                                    />
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                </View>

                                {/* Reminder Settings */}
                                <View style={styles.inputGroup}>
                                    <View style={styles.switchRow}>
                                        <Text style={styles.label}>REMIND ME</Text>
                                        <Switch
                                            value={reminderEnabled}
                                            onValueChange={setReminderEnabled}
                                            trackColor={{ false: '#333', true: habitType === 'positive' ? COLORS.bioOrange : CRIMSON }}
                                            thumbColor={COLORS.mist}
                                        />
                                    </View>

                                    {reminderEnabled && (
                                        <View style={styles.timePickerContainer}>
                                            {Platform.OS === 'android' && (
                                                <Pressable
                                                    style={styles.timeButton}
                                                    onPress={() => setShowAndroidPicker(true)}
                                                >
                                                    <Text style={styles.timeButtonText}>
                                                        {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </Pressable>
                                            )}

                                            {(Platform.OS === 'ios' || showAndroidPicker) && (
                                                <DateTimePicker
                                                    value={reminderTime}
                                                    mode="time"
                                                    display="spinner"
                                                    onChange={(event, selectedDate) => {
                                                        if (Platform.OS === 'android') {
                                                            setShowAndroidPicker(false);
                                                        }
                                                        if (selectedDate) {
                                                            setReminderTime(selectedDate);
                                                        }
                                                    }}
                                                    textColor={COLORS.mist}
                                                />
                                            )}
                                        </View>
                                    )}
                                </View>

                                <View style={{ height: 20 }} />
                            </ScrollView>

                            {/* Submit Button */}
                            <Pressable
                                style={[
                                    styles.submitButton,
                                    habitType === 'negative' && styles.submitButtonNegative,
                                    !title.trim() && styles.submitButtonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={!title.trim()}
                            >
                                <Text style={styles.submitButtonText}>MANIFEST</Text>
                                <Check size={20} color={COLORS.voidBlue} strokeWidth={3} />
                            </Pressable>
                        </>
                    ) : (
                        /* Protocols Tab */
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.protocolsContainer}
                        >
                            {PROTOCOLS.map(protocol => {
                                const IconComponent = getProtocolIcon(protocol.icon);
                                return (
                                    <Pressable
                                        key={protocol.id}
                                        style={[styles.protocolCard, { borderColor: protocol.color }]}
                                        onPress={() => handleProtocolSelect(protocol)}
                                    >
                                        {/* Protocol Header */}
                                        <View style={[styles.protocolIconContainer, { backgroundColor: protocol.color }]}>
                                            <IconComponent size={32} color="#fff" />
                                        </View>
                                        <Text style={styles.protocolName}>{protocol.name}</Text>
                                        <Text style={styles.protocolDescription}>{protocol.description}</Text>

                                        {/* Habits Preview */}
                                        <View style={styles.protocolHabits}>
                                            {protocol.habits.map((habit, idx) => (
                                                <View key={idx} style={styles.protocolHabitRow}>
                                                    <View style={[
                                                        styles.protocolHabitDot,
                                                        { backgroundColor: habit.type === 'positive' ? COLORS.bioOrange : CRIMSON }
                                                    ]} />
                                                    <Text style={styles.protocolHabitText}>{habit.title}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Action hint */}
                                        <View style={styles.protocolAction}>
                                            <Text style={[styles.protocolActionText, { color: protocol.color }]}>Tap to activate</Text>
                                            <ChevronRight size={14} color={protocol.color} />
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    )}

                    <View style={{ height: Platform.OS === 'ios' ? 40 : 20 }} />
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdrop: {
        flex: 1,
    },
    sheet: {
        backgroundColor: COLORS.voidBlue,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        maxHeight: '85%',
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.mist,
        opacity: 0.3,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontFamily: TYPOGRAPHY.fonts.monoBold,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.mist,
        letterSpacing: 2,
    },
    closeButton: {
        padding: 8,
    },
    // Tab styles
    tabContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    tabActive: {
        backgroundColor: COLORS.bioOrange,
    },
    tabText: {
        fontFamily: TYPOGRAPHY.fonts.sansMedium,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
    },
    tabTextActive: {
        color: COLORS.voidBlue,
    },
    // Form styles
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        opacity: 0.5,
        letterSpacing: 2,
        marginBottom: 12,
    },
    typeToggle: {
        flexDirection: 'row',
        gap: 12,
    },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    typeOptionActivePositive: {
        backgroundColor: COLORS.bioOrange,
        borderColor: COLORS.bioOrange,
    },
    typeOptionActiveNegative: {
        backgroundColor: '#ff4d4d',
        borderColor: '#ff4d4d',
    },
    typeOptionText: {
        fontFamily: TYPOGRAPHY.fonts.sansMedium,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
    },
    typeOptionTextActive: {
        color: COLORS.voidBlue,
    },
    typeOptionTextActiveNegative: {
        color: COLORS.voidBlue,
    },
    textInput: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.mist,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 12,
    },
    iconList: {
        gap: 12,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconOptionSelected: {
        backgroundColor: COLORS.bioOrange,
    },
    iconOptionSelectedNegative: {
        backgroundColor: '#ff4d4d',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timePickerContainer: {
        marginTop: 12,
    },
    timeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    timeButtonText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.mist,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.bioOrange,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    submitButtonNegative: {
        backgroundColor: '#ff4d4d',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontFamily: TYPOGRAPHY.fonts.sansMedium,
        fontSize: TYPOGRAPHY.sizes.base,
        color: COLORS.voidBlue,
        fontWeight: '600',
        letterSpacing: 1,
    },
    // Protocol styles
    protocolsContainer: {
        paddingBottom: 20,
        gap: 16,
    },
    protocolCard: {
        width: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    protocolIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    protocolName: {
        fontFamily: TYPOGRAPHY.fonts.sansMedium,
        fontSize: TYPOGRAPHY.sizes.lg,
        color: COLORS.mist,
        marginBottom: 4,
    },
    protocolDescription: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.mist,
        opacity: 0.5,
        marginBottom: 16,
    },
    protocolHabits: {
        gap: 8,
        marginBottom: 16,
    },
    protocolHabitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    protocolHabitDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    protocolHabitText: {
        fontFamily: TYPOGRAPHY.fonts.sans,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.mist,
        opacity: 0.8,
    },
    protocolAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    protocolActionText: {
        fontFamily: TYPOGRAPHY.fonts.mono,
        fontSize: TYPOGRAPHY.sizes.xs,
        letterSpacing: 1,
    },
});
