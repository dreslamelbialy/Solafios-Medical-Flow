/**
 * Solafios Mediflow - Notification Web API Service
 * Handles requesting browser permissions and scheduling/triggering
 * local browser notifications exactly when a reminder's reminder_time is reached.
 */

import { Medicine, Reminder, UserSettings } from '../types/mediflow';
import { playReminderChime } from './audioAlert';

export interface ReminderNotificationOptions {
  reminderId: string;
  medicineName: string;
  dose: string;
  strength?: string;
  notes?: string;
  reminderTime: string;
  lang?: 'ar' | 'en';
  playSound?: boolean;
  onClick?: () => void;
}

/**
 * Checks whether the Notification Web API is supported in the current environment.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission status ('default' | 'granted' | 'denied' | 'unsupported').
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests permission from the user to display browser notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    console.warn('[Mediflow Notifications] Notification Web API is not supported in this browser.');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('[Mediflow Notifications] Failed to request notification permission:', error);
    return Notification.permission;
  }
}

/**
 * Triggers a local browser notification for a medicine reminder.
 */
export function triggerReminderNotification(options: ReminderNotificationOptions): Notification | null {
  if (!isNotificationSupported()) {
    console.warn('[Mediflow Notifications] Notification API not supported.');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Mediflow Notifications] Permission not granted. Current state:', Notification.permission);
    return null;
  }

  const isAr = options.lang !== 'en';
  const title = isAr
    ? `💊 حان موعد دواء: ${options.medicineName}`
    : `💊 Medication Due: ${options.medicineName}`;

  const strengthPart = options.strength ? ` (${options.strength})` : '';
  const body = isAr
    ? `الجرعة: ${options.dose}${strengthPart}\n${options.notes ? `ملاحظات: ${options.notes}\n` : ''}يرجى تناول الدواء في وقته المحدد.`
    : `Dose: ${options.dose}${strengthPart}\n${options.notes ? `Note: ${options.notes}\n` : ''}Please take your dose as scheduled.`;

  try {
    const notification = new Notification(title, {
      body,
      tag: `mediflow-reminder-${options.reminderId}`, // Prevents duplicate notifications
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true, // Keep notification visible until user interacts
      silent: !options.playSound, // Respect sound preference
    });

    // Play synthesized Web Audio chime if enabled
    if (options.playSound) {
      playReminderChime();
    }

    notification.onclick = () => {
      // Bring tab into focus if minimized or in background
      if (typeof window !== 'undefined') {
        window.focus();
      }
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('[Mediflow Notifications] Error triggering browser notification:', err);
    return null;
  }
}

/**
 * Schedules a local browser notification to trigger exactly when reminder.reminder_time is reached.
 * Returns a cancel function to clear the scheduled timer if the reminder is taken, snoozed, or deleted.
 */
export function scheduleReminderNotification(
  reminder: Reminder,
  medicine: Medicine,
  options: {
    lang?: 'ar' | 'en';
    playSound?: boolean;
    onTrigger?: (reminderId: string) => void;
  } = {}
): () => void {
  const targetTime = new Date(reminder.reminder_time).getTime();
  const now = Date.now();
  const delay = targetTime - now;

  // If reminder is in the past by more than 15 minutes, don't trigger
  if (delay < -15 * 60 * 1000) {
    return () => {};
  }

  // If due right now or within the last 15 seconds, trigger immediately
  if (delay <= 0) {
    triggerReminderNotification({
      reminderId: reminder.id,
      medicineName: medicine.name,
      dose: medicine.dose,
      strength: medicine.strength,
      notes: medicine.notes,
      reminderTime: reminder.reminder_time,
      lang: options.lang,
      playSound: options.playSound,
    });
    if (options.onTrigger) {
      options.onTrigger(reminder.id);
    }
    return () => {};
  }

  // Max 32-bit signed integer for setTimeout (~24.8 days)
  const MAX_TIMEOUT = 2147483647;
  if (delay > MAX_TIMEOUT) {
    return () => {};
  }

  // Set timeout to trigger EXACTLY when reminder_time is reached
  const timerId = window.setTimeout(() => {
    triggerReminderNotification({
      reminderId: reminder.id,
      medicineName: medicine.name,
      dose: medicine.dose,
      strength: medicine.strength,
      notes: medicine.notes,
      reminderTime: reminder.reminder_time,
      lang: options.lang,
      playSound: options.playSound,
    });
    if (options.onTrigger) {
      options.onTrigger(reminder.id);
    }
  }, delay);

  return () => {
    window.clearTimeout(timerId);
  };
}

/**
 * Manages active timers for a collection of reminders.
 * Schedules exact timers for all pending reminders and cleans up past or removed ones.
 */
export class ReminderNotificationScheduler {
  private activeTimers = new Map<string, () => void>();

  public syncReminders(
    reminders: Reminder[],
    medicines: Medicine[],
    settings: UserSettings,
    onReminderSent?: (reminderId: string) => void
  ): void {
    const medicineMap = new Map<string, Medicine>();
    medicines.forEach((m) => medicineMap.set(m.id, m));

    const activeReminderIds = new Set<string>();

    reminders.forEach((reminder) => {
      // Only schedule pending reminders
      if (reminder.status !== 'pending') {
        if (this.activeTimers.has(reminder.id)) {
          this.activeTimers.get(reminder.id)!();
          this.activeTimers.delete(reminder.id);
        }
        return;
      }

      const medicine = medicineMap.get(reminder.medicine_id);
      if (!medicine) return;

      activeReminderIds.add(reminder.id);

      // If already scheduled, don't re-schedule unless cancelled
      if (this.activeTimers.has(reminder.id)) {
        return;
      }

      const cancelTimer = scheduleReminderNotification(reminder, medicine, {
        lang: settings.language,
        playSound: settings.sound_enabled,
        onTrigger: (remId) => {
          this.activeTimers.delete(remId);
          if (onReminderSent) {
            onReminderSent(remId);
          }
        },
      });

      this.activeTimers.set(reminder.id, cancelTimer);
    });

    // Clean up timers for reminders that no longer exist
    for (const [id, cancel] of this.activeTimers.entries()) {
      if (!activeReminderIds.has(id)) {
        cancel();
        this.activeTimers.delete(id);
      }
    }
  }

  public clearAll(): void {
    for (const cancel of this.activeTimers.values()) {
      cancel();
    }
    this.activeTimers.clear();
  }
}

export const globalReminderScheduler = new ReminderNotificationScheduler();
