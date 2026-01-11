/**
 * Notification Manager
 * 
 * Handles permission requests and scheduling of local notifications.
 * Uses expo-notifications.
 * 
 * Refactored to lazy-load 'expo-notifications' to prevent crashes on Android in Expo Go (SDK 53+),
 * where remote notification functionality is stripped out and can cause issues at import time.
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Lazy-loaded variable
let Notifications: any = null;

const getNotifications = () => {
    // Check for Expo Go on Android explicitly
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (Platform.OS === 'android' && isExpoGo) {
        console.log('Notifications skipped in Expo Go on Android (SDK 53+ limitation)');
        return null;
    }

    if (!Notifications) {
        try {
            Notifications = require('expo-notifications');
            // Configure handler once loaded
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        } catch (e) {
            console.warn('Failed to load expo-notifications:', e);
            return null;
        }
    }
    return Notifications;
};

export const NotificationManager = {
    /**
     * Request permissions for notifications
     */
    requestPermissions: async () => {
        const notifs = getNotifications();
        if (!notifs) return false;

        if (Platform.OS === 'android') {
            try {
                await notifs.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: notifs.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            } catch (e) {
                console.log('Error setting notification channel (likely Expo Go limitation):', e);
            }
        }

        if (Device.isDevice) {
            try {
                const { status: existingStatus } = await notifs.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await notifs.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.log('Failed to get push token for push notification!');
                    return false;
                }
                return true;
            } catch (e) {
                console.warn('Notification permission request failed:', e);
                return false;
            }
        } else {
            console.log('Must use physical device for Push Notifications');
            return false;
        }
    },

    /**
     * Schedule a daily reminder
     * @param id Unique identifier for the notification reference
     * @param title Notification title
     * @param body Notification body
     * @param hour Hour (0-23)
     * @param minute Minute (0-59)
     */
    scheduleDailyReminder: async (id: string, title: string, body: string, hour: number, minute: number) => {
        const notifs = getNotifications();
        if (!notifs) return null;

        try {
            // Use implicit type compatible with CalendarTriggerInput which supports repeats
            const trigger = {
                type: notifs.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            };

            const notificationId = await notifs.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: 'default',
                },
                trigger,
            });

            return notificationId;
        } catch (e) {
            console.warn('Failed to schedule notification:', e);
            return null;
        }
    },

    /**
     * Cancel all notifications (debugging/reset)
     */
    cancelAll: async () => {
        const notifs = getNotifications();
        if (!notifs) return;

        try {
            await notifs.cancelAllScheduledNotificationsAsync();
        } catch (e) {
            console.warn('Failed to cancel notifications:', e);
        }
    }
};
