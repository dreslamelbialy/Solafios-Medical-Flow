import { DoseSchedule, Medicine, Reminder, UserSettings } from '../types/mediflow';

/**
 * Parses "HH:mm" time string into hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0] || '8', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  return { hours, minutes };
}

/**
 * Adjusts a base date's hours and minutes, adding offset minutes if any
 */
function setDateTime(baseDate: Date, timeStr: string, offsetMinutes = 0): Date {
  const d = new Date(baseDate);
  const { hours, minutes } = parseTimeString(timeStr);
  d.setHours(hours, minutes, 0, 0);
  if (offsetMinutes !== 0) {
    d.setMinutes(d.getMinutes() + offsetMinutes);
  }
  return d;
}

/**
 * Calculates all scheduled doses and reminders for a medicine based on user settings
 */
export function calculateDosesAndReminders(
  medicine: Medicine,
  settings: UserSettings
): { doses: DoseSchedule[]; reminders: Reminder[] } {
  const doses: DoseSchedule[] = [];
  const reminders: Reminder[] = [];

  const startDate = new Date(medicine.first_dose_time);
  if (isNaN(startDate.getTime())) {
    return { doses, reminders };
  }

  const durationDays = Math.max(1, medicine.duration || 1);
  const timesPerDay = Math.max(1, medicine.times_per_day || 1);

  // Determine daily time points for day 1
  for (let dayIndex = 0; dayIndex < durationDays; dayIndex++) {
    const currentDayDate = new Date(startDate);
    currentDayDate.setDate(startDate.getDate() + dayIndex);

    // Calculate times for this day
    const dayTimes: Date[] = [];

    if (medicine.schedule === 'custom_interval') {
      // Interval calculation: 24h / timesPerDay
      const intervalHours = 24 / timesPerDay;
      const initialDose = new Date(startDate);
      const startHour = initialDose.getHours();
      const startMin = initialDose.getMinutes();

      for (let t = 0; t < timesPerDay; t++) {
        const doseDate = new Date(currentDayDate);
        doseDate.setHours(startHour, startMin, 0, 0);
        doseDate.setMinutes(doseDate.getMinutes() + Math.round(t * intervalHours * 60));
        dayTimes.push(doseDate);
      }
    } else {
      // Meal-linked or routine-linked calculation
      if (timesPerDay === 1) {
        // Single daily dose linked to chosen schedule
        let doseTime: Date;
        switch (medicine.schedule) {
          case 'before_breakfast':
            doseTime = setDateTime(currentDayDate, settings.breakfast_time, -30);
            break;
          case 'after_breakfast':
            doseTime = setDateTime(currentDayDate, settings.breakfast_time, 30);
            break;
          case 'before_lunch':
            doseTime = setDateTime(currentDayDate, settings.lunch_time, -30);
            break;
          case 'after_lunch':
            doseTime = setDateTime(currentDayDate, settings.lunch_time, 30);
            break;
          case 'before_dinner':
            doseTime = setDateTime(currentDayDate, settings.dinner_time, -30);
            break;
          case 'after_dinner':
            doseTime = setDateTime(currentDayDate, settings.dinner_time, 30);
            break;
          case 'before_sleep':
            doseTime = setDateTime(currentDayDate, settings.sleep_time, -15);
            break;
          case 'after_wake':
            doseTime = setDateTime(currentDayDate, settings.wake_time, 15);
            break;
          default:
            doseTime = new Date(currentDayDate);
            doseTime.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
        }
        dayTimes.push(doseTime);
      } else if (timesPerDay === 2) {
        // Twice daily: typically breakfast and dinner
        const isBefore = medicine.schedule.startsWith('before');
        const offset = isBefore ? -30 : 30;
        dayTimes.push(setDateTime(currentDayDate, settings.breakfast_time, offset));
        dayTimes.push(setDateTime(currentDayDate, settings.dinner_time, offset));
      } else if (timesPerDay === 3) {
        // Three times daily: breakfast, lunch, dinner
        const isBefore = medicine.schedule.startsWith('before');
        const offset = isBefore ? -30 : 30;
        dayTimes.push(setDateTime(currentDayDate, settings.breakfast_time, offset));
        dayTimes.push(setDateTime(currentDayDate, settings.lunch_time, offset));
        dayTimes.push(setDateTime(currentDayDate, settings.dinner_time, offset));
      } else if (timesPerDay >= 4) {
        // Four or more times: breakfast, lunch, dinner, bedtime
        const isBefore = medicine.schedule.startsWith('before');
        const offset = isBefore ? -30 : 30;
        dayTimes.push(setDateTime(currentDayDate, settings.breakfast_time, offset));
        dayTimes.push(setDateTime(currentDayDate, settings.lunch_time, offset));
        dayTimes.push(setDateTime(currentDayDate, settings.dinner_time, offset));
        dayTimes.push(setDateTime(currentDayDate, settings.sleep_time, -15));
        
        // If > 4, distribute remaining
        for (let extra = 4; extra < timesPerDay; extra++) {
          const doseDate = new Date(currentDayDate);
          doseDate.setHours(9 + (extra - 4) * 3, 0, 0, 0);
          dayTimes.push(doseDate);
        }
      }
    }

    // Sort times chronologically for this day
    dayTimes.sort((a, b) => a.getTime() - b.getTime());

    dayTimes.forEach((dt, idx) => {
      const doseId = `dose-${medicine.id}-${dayIndex}-${idx}-${Date.now().toString(36)}`;
      const reminderId = `rem-${medicine.id}-${dayIndex}-${idx}-${Date.now().toString(36)}`;

      doses.push({
        id: doseId,
        medicine_id: medicine.id,
        dose_time: dt.toISOString(),
        taken: false,
        skipped: false,
        created_at: new Date().toISOString(),
      });

      reminders.push({
        id: reminderId,
        medicine_id: medicine.id,
        reminder_time: dt.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    });
  }

  return { doses, reminders };
}

/**
 * Helper to calculate adherence percentage
 */
export function calculateAdherence(doses: DoseSchedule[]): {
  total: number;
  taken: number;
  skipped: number;
  pending: number;
  percentage: number;
} {
  const total = doses.length;
  if (total === 0) {
    return { total: 0, taken: 0, skipped: 0, pending: 0, percentage: 100 };
  }

  const taken = doses.filter((d) => d.taken).length;
  const skipped = doses.filter((d) => d.skipped).length;
  const pending = total - taken - skipped;
  const percentage = Math.round((taken / total) * 100);

  return { total, taken, skipped, pending, percentage };
}

/**
 * Format date & time localized
 */
export function formatTimeArabic(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateArabic(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('ar-EG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
