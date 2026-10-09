/**
 * Solafios Mediflow - Universal Calendar & Alarm Integration Service
 * Enables syncing medication doses and reminders to:
 * 1. Google Calendar (Direct Web Intent)
 * 2. Native Phone Alarms & Calendars (Apple iOS, Samsung, Android, Windows, Mac via .ics with VALARM)
 */

import { Medicine, DoseSchedule, Reminder } from '../types/mediflow';

/**
 * Format a Date object into iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function toIcsUtc(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Generate a direct Google Calendar Web Intent URL with pre-filled title, time, recurrence, and alarm
 */
export function getGoogleCalendarUrl(
  medicine: Medicine,
  doseTimeIso: string,
  lang: 'ar' | 'en' = 'ar'
): string {
  const isAr = lang === 'ar';
  const start = new Date(doseTimeIso);
  // Default 15 min duration
  const end = new Date(start.getTime() + 15 * 60000);

  const title = isAr
    ? `💊 موعد دواء: ${medicine.name}`
    : `💊 Medication: ${medicine.name}`;

  const details = isAr
    ? `الجرعة: ${medicine.dose}${medicine.strength ? ` (${medicine.strength})` : ''}\n` +
      `عدد الحبات: ${medicine.pills_per_dose || 1}\n` +
      (medicine.notes ? `ملاحظات: ${medicine.notes}\n` : '') +
      (medicine.doctor_name ? `الطبيب: ${medicine.doctor_name}\n` : '') +
      `تطبيق Solafios MediFlow`
    : `Dose: ${medicine.dose}${medicine.strength ? ` (${medicine.strength})` : ''}\n` +
      `Amount: ${medicine.pills_per_dose || 1} pills\n` +
      (medicine.notes ? `Notes: ${medicine.notes}\n` : '') +
      `Solafios MediFlow App`;

  const datesParam = `${toIcsUtc(start)}/${toIcsUtc(end)}`;

  // Google Calendar URL template
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', title);
  url.searchParams.set('dates', datesParam);
  url.searchParams.set('details', details);
  url.searchParams.set('location', 'المنزل / صيدلية العائلة');

  // If medication has duration > 1 day, add daily recurrence
  if (medicine.duration && medicine.duration > 1) {
    url.searchParams.set('recur', `RRULE:FREQ=DAILY;COUNT=${medicine.duration}`);
  }

  return url.toString();
}

/**
 * Generate iCalendar (.ics) string for a single medication dose with native alarm trigger (VALARM)
 */
export function generateSingleDoseIcs(
  medicine: Medicine,
  doseTimeIso: string,
  lang: 'ar' | 'en' = 'ar'
): string {
  const isAr = lang === 'ar';
  const start = new Date(doseTimeIso);
  const end = new Date(start.getTime() + 15 * 60000);
  const now = new Date();

  const title = isAr
    ? `💊 موعد دواء: ${medicine.name}`
    : `💊 Medication: ${medicine.name}`;

  const description = isAr
    ? `الجرعة: ${medicine.dose} ${medicine.strength || ''}\\nملاحظات: ${medicine.notes || 'حسب الوصفة'}\\nتطبيق Solafios Mediflow`
    : `Dose: ${medicine.dose} ${medicine.strength || ''}\\nNotes: ${medicine.notes || 'As prescribed'}\\nSolafios Mediflow`;

  const recurrenceRule =
    medicine.duration && medicine.duration > 1
      ? `RRULE:FREQ=DAILY;COUNT=${medicine.duration}\n`
      : '';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Solafios//MediFlow Medication Tracker//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:mediflow-dose-${medicine.id}-${start.getTime()}@solafios.mediflow`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    recurrenceRule ? recurrenceRule.trim() : null,
    'STATUS:CONFIRMED',
    // Native Device Alarm Sound / Notification
    'BEGIN:VALARM',
    'TRIGGER:-PT0M', // Ring exactly at dose time
    'ACTION:DISPLAY',
    `DESCRIPTION:${title} - تناول جرعتك الآن`,
    'END:VALARM',
    // 5 minutes beforehand reminder alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    `DESCRIPTION:تذكير مسبق (5 دقائق): ${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return icsLines.join('\r\n');
}

/**
 * Generate iCalendar (.ics) containing all upcoming doses for all active medications
 */
export function generateFullScheduleIcs(
  medicines: Medicine[],
  doses: DoseSchedule[],
  lang: 'ar' | 'en' = 'ar'
): string {
  const isAr = lang === 'ar';
  const now = new Date();
  const medicineMap = new Map<string, Medicine>();
  medicines.forEach((m) => medicineMap.set(m.id, m));

  const eventBlocks: string[] = [];

  // Group doses or list pending/upcoming doses
  const upcomingDoses = doses.filter((d) => !d.taken);

  upcomingDoses.forEach((d) => {
    const med = medicineMap.get(d.medicine_id);
    if (!med) return;

    const start = new Date(d.dose_time);
    const end = new Date(start.getTime() + 15 * 60000);

    const title = isAr
      ? `💊 ${med.name} (${med.dose})`
      : `💊 ${med.name} (${med.dose})`;

    const description = isAr
      ? `الجرعة: ${med.dose} ${med.strength || ''}\\nملاحظات: ${med.notes || 'حسب الجدول'}\\nالمريض: ${med.patient_name || 'الملف الشخصي'}`
      : `Dose: ${med.dose} ${med.strength || ''}\\nNotes: ${med.notes || 'Prescribed'}`;

    eventBlocks.push(
      [
        'BEGIN:VEVENT',
        `UID:mediflow-dose-${d.id}@solafios.mediflow`,
        `DTSTAMP:${toIcsUtc(now)}`,
        `DTSTART:${toIcsUtc(start)}`,
        `DTEND:${toIcsUtc(end)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT0M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${title}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n')
    );
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Solafios//MediFlow Full Schedule//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:مواعيد أدوية Solafios MediFlow',
    ...eventBlocks,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers download / opening of an .ics file in browser/mobile
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Detect device type for contextual help
 */
export function detectDevice(): {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  if (typeof window === 'undefined') {
    return { isMobile: false, isIOS: false, isAndroid: false, isTablet: false, isDesktop: true };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isTablet = /iPad|Tablet|PlayBook/.test(ua) || (isAndroid && !/Mobile/.test(ua));
  const isMobile = /Mobi|Android|iPhone|iPod/.test(ua) || isTablet;
  const isDesktop = !isMobile;

  return { isMobile, isIOS, isAndroid, isTablet, isDesktop };
}
