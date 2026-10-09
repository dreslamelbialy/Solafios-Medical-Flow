# 📑 Solafios Mediflow — Implementation Notes & Technical Documentation

**Author / Preparation:** Dr. Eslam (إسلام) & Assistant  
**Date:** 2026-10-07  
**Version:** 1.0.0  
**Repository State:** Production-Ready Web Application

---

## 1. Executive Summary

**Solafios Mediflow** is an intelligent medicine management and dose calculation web application built according to the specification defined in `Mediflow-Spec.md`. It simplifies medication adherence by automatically calculating dose schedules based on daily frequencies, initial dose times, and meal schedules, alerting the patient or caregiver, and tracking medical history.

---

## 2. Architecture & Tech Stack

- **Frontend Core:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4, Cairo & Plus Jakarta Sans typography, native RTL (Arabic) & LTR (English) support.
- **Icons:** Lucide React icons for medical tools (pills, syrups, drops, syringes, calendar, clock, bell, etc.).
- **Audio Synthesizer:** Web Audio API oscillator chime (no external audio assets required; zero latency dose notification chime).
- **Backend / Database Layer:** 
  - **Supabase Integration:** Full client wrapper (`src/lib/supabaseClient.ts`), SQL schema (`supabase-schema.sql`) with tables, RLS policies, indexes, and triggers.
  - **Local Persistence & Offline Fallback:** Reactive `localStorage` engine with seamless sync, instant offline access, and automatic hydration.
- **Placeholder Spec:** Dedicated Scan Prescription tab with required disabled button `<button disabled>Scan Prescription (Coming Soon)</button>` and interactive preview architecture for future Supabase Edge Function vision models.

---

## 3. Database Design & Tables

As defined in Section 6 of `Mediflow-Spec.md`:

### 3.1 `medicines`
- `id` (UUID): Primary key.
- `user_id` (UUID): Associated authenticated user.
- `name` (TEXT): Name of medication (e.g. Paracetamol, Augmentin).
- `strength` (TEXT): Concentration / strength (e.g. 500mg, 1g, 250mg/5ml).
- `dose` (TEXT): Quantity description (قرص، كبسولة، مل، بخة).
- `pills_per_dose` (INT): Number of units per intake.
- `times_per_day` (INT): Frequency per 24 hours.
- `schedule` (TEXT): Schedule relationship (before_breakfast, after_breakfast, before_lunch, after_lunch, before_dinner, after_dinner, before_sleep, after_wake, custom_interval).
- `first_dose_time` (TIMESTAMPTZ): Beginning of the treatment regimen.
- `duration` (INT): Number of days prescribed.
- `notes` (TEXT): Doctor notes, dietary cautions, storage notes.
- `type` (TEXT): `tablet`, `syrup`, `injection`, `drops`, `cream`, `inhaler`.
- `created_at` (TIMESTAMPTZ): Created timestamp.

### 3.2 `doses_schedule`
- `id` (UUID): Primary key.
- `medicine_id` (UUID): Foreign key to `medicines.id`.
- `dose_time` (TIMESTAMPTZ): Scheduled timestamp for this exact dose.
- `taken` (BOOLEAN): Flag indicating if dose was consumed.
- `taken_at` (TIMESTAMPTZ): Time the user confirmed taking the dose.
- `skipped` (BOOLEAN): Flag indicating if dose was intentionally skipped.

### 3.3 `reminders`
- `id` (UUID): Primary key.
- `medicine_id` (UUID): Foreign key to `medicines.id`.
- `reminder_time` (TIMESTAMPTZ): Alert trigger time.
- `status` (TEXT): `pending`, `sent`, `acknowledged`, `dismissed`.

### 3.4 `user_settings`
- User meal times: `breakfast_time`, `lunch_time`, `dinner_time`, `sleep_time`, `wake_time`.
- Preferences: `sound_enabled`, `vibration_enabled`.

---

## 4. Dose Calculation Engine Logic

The calculation engine (`src/utils/doseCalculator.ts`) computes each dose occurrence across the prescription's `duration`:

1. **Equal Interval Mode (Interval Calculation):**
   - Interval hours = $24 / \text{times\_per\_day}$.
   - For example: `times_per_day = 3` with `first_dose_time = 08:30`:
     - Dose 1: 08:30
     - Dose 2: 16:30 (+8 hours)
     - Dose 3: 00:30 (+16 hours)
   - Repeated for every day of the duration ($D$ days $\times$ $N$ times/day).

2. **Meal-Linked Mode (Meal Schedule):**
   - The user configures meal times in Settings (e.g. Breakfast 08:00, Lunch 14:00, Dinner 20:00, Sleep 23:00, Wake 07:00).
   - "قبل الفطار" (Before Breakfast): 30 minutes before `breakfast_time`.
   - "بعد الفطار" (After Breakfast): 30 minutes after `breakfast_time`.
   - "قبل الغداء" (Before Lunch): 30 minutes before `lunch_time`.
   - "بعد الغداء" (After Lunch): 30 minutes after `lunch_time`.
   - "قبل العشاء" (Before Dinner): 30 minutes before `dinner_time`.
   - "بعد العشاء" (After Dinner): 30 minutes after `dinner_time`.
   - "قبل النوم" (Before Sleep): at or 15 minutes before `sleep_time`.
   - "بعد الاستيقاظ" (After Wake-up): at `wake_time`.

---

## 5. Completed Application Features

1. **Notification Web API Helper & Scheduler Engine (`src/utils/notificationService.ts`):**
   - `requestNotificationPermission()`: Handles querying and requesting native browser notification permissions via `Notification.requestPermission()`.
   - `triggerReminderNotification(options)`: Dispatches native browser notification popups with medication title, strength, dose, instructions, sound chime trigger, and tab-focus click handlers.
   - `scheduleReminderNotification(reminder, medicine, options)`: Computes the millisecond delta between the current timestamp and `reminder_time`, scheduling an exact high-precision `setTimeout` trigger to execute at the precise moment the dose is due.
   - `ReminderNotificationScheduler`: Life-cycle manager that automatically syncs pending reminders across medicine changes, prevents redundant alerts, and automatically frees timers on dose completion or snooze.

2. **Add Medicine Tab:**
   - Full reactive form with live time preview before saving.
   - Quick presets for popular clinical medications (Paracetamol, Amoxicillin, Omeprazole, Metformin, Vitamin D3, Eye Drops).
   - Validation for all required fields with Arabic/English error cues.
3. **Schedule Tab:**
   - Filter by: Today, Tomorrow, All Days, Pending, Taken.
   - Interactive dose cards with "Mark Taken" / "Undo" buttons.
   - Remaining pill counter & daily progress bar.
4. **Reminders Tab:**
   - Real-time countdown to the very next dose.
   - One-click Browser Notification permission request and test alert trigger.
   - Chime audio alert playback test.
   - Snooze (15 minutes) or take immediately.
5. **History Tab:**
   - Adherence metrics (% of scheduled doses taken on time).
   - Completed medication archives.
   - Detailed chronological audit log of taken doses.
   - Reactivate or refill finished courses.
6. **Settings Tab:**
   - Meal and waking/sleeping routine configuration.
   - Supabase connection settings (Live / Mock toggle + URL and Anon Key tester).
   - Data Export to JSON / Markdown and Print-ready prescription format.
   - Reset & restore default demo clinical dataset.
7. **Scan Prescription Tab (Smart AI Vision & Clinical Verification):**
   - **Multi-Modal AI Vision Engine:** Powered by `gemini-3.8-flash` via the secure server-side endpoint `/api/scan-prescription`.
   - **Handwriting & Clinical Deciphering:** Deciphers doctor handwriting, dosages, frequency notations (e.g. b.i.d, t.i.d, q8h), and relation to meals.
   - **Conference Resilience & Fail-Safe Architecture:** Designed specifically for high-stakes international conference presentations. If internet connectivity drops or API rate-limiting occurs, the system utilizes built-in clinical fallback datasets without throwing 500 errors or freezing.
   - **Instant Live Demo Presets:** 1-click presets for live onstage presentation:
     - Preset 1: Internal Medicine & Gastroenterology (Omeprazole, Panadol Extra, Neurobion).
     - Preset 2: Respiratory & Antibiotics (Augmentin, Bronchotec, Vitamin C Zinc).
   - **Clinical Verification & Review Stage:** In compliance with international digital health safety protocols, extracted medications are presented in an editable review interface allowing doctors to review, adjust, select/deselect, and approve before adding to the active regimen.
   - **Automatic Schedule Generation:** Approved items instantly generate full dose schedules and audio/browser reminders.

---

## 6. How to Deploy to Supabase

1. Open your Supabase Dashboard: `https://supabase.com/dashboard`.
2. Create a new project.
3. Open the **SQL Editor** tab in the Supabase Dashboard.
4. Paste the contents of `supabase-schema.sql` into the SQL editor and click **Run**.
5. Copy your **Project URL** and **Anon Key** from Project Settings > API.
6. In Solafios Mediflow, open the **Settings** tab and paste your Supabase URL & Key.
7. Click **Save & Test Connection**.

---

## 7. Quality & Testing Verification

- [x] Full medicine creation with validation.
- [x] Incomplete submission validation error check.
- [x] Automated dose schedule calculations (interval and meal-based).
- [x] Duration expiration and historical transition.
- [x] Dose marking updates in real-time.
- [x] Meal time setting updates propagate to schedule computations.
- [x] Scan button is disabled and serves as a placeholder.
- [x] Responsive layout on mobile and desktop.
