import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Medicine, DoseSchedule, Reminder, UserSettings } from '../types/mediflow';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  const finalUrl = url || metaEnv?.VITE_SUPABASE_URL || '';
  const finalKey = anonKey || metaEnv?.VITE_SUPABASE_ANON_KEY || '';

  if (!finalUrl || !finalKey) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(finalUrl, finalKey);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return clientInstance;
}

export function resetSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
  try {
    clientInstance = createClient(url, anonKey);
    return clientInstance;
  } catch (e) {
    console.warn('Failed to reset Supabase client:', e);
    return null;
  }
}

/**
 * Tests connection to Supabase
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url, anonKey);
    const { error } = await tempClient.from('medicines').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.medicines" does not exist')) {
        return {
          success: false,
          message: 'تم الاتصال بـ Supabase بنجاح ولكن الجداول لم تُنشأ بعد! يرجى تنفيذ ملف supabase-schema.sql في SQL Editor.',
        };
      }
      return { success: false, message: `فشل الاتصال: ${error.message}` };
    }
    return { success: true, message: 'تم الاتصال بـ Supabase بنجاح، الجداول موجودة وجاهزة!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `تعذر الاتصال بـ Supabase: ${errorMsg}` };
  }
}

/**
 * Service to sync medicine to Supabase
 */
export async function syncMedicineToSupabase(
  client: SupabaseClient,
  medicine: Medicine,
  doses: DoseSchedule[],
  reminders: Reminder[]
): Promise<boolean> {
  try {
    const { error: medError } = await client.from('medicines').upsert({
      id: medicine.id,
      name: medicine.name,
      strength: medicine.strength,
      dose: medicine.dose,
      pills_per_dose: medicine.pills_per_dose,
      times_per_day: medicine.times_per_day,
      schedule: medicine.schedule,
      first_dose_time: medicine.first_dose_time,
      duration: medicine.duration,
      notes: medicine.notes,
      type: medicine.type,
      created_at: medicine.created_at,
    });

    if (medError) throw medError;

    if (doses.length > 0) {
      const { error: doseError } = await client.from('doses_schedule').upsert(
        doses.map((d) => ({
          id: d.id,
          medicine_id: d.medicine_id,
          dose_time: d.dose_time,
          taken: d.taken,
          taken_at: d.taken_at || null,
          skipped: d.skipped || false,
          created_at: d.created_at,
        }))
      );
      if (doseError) throw doseError;
    }

    if (reminders.length > 0) {
      const { error: remError } = await client.from('reminders').upsert(
        reminders.map((r) => ({
          id: r.id,
          medicine_id: r.medicine_id,
          reminder_time: r.reminder_time,
          status: r.status,
          created_at: r.created_at,
        }))
      );
      if (remError) throw remError;
    }

    return true;
  } catch (err) {
    console.error('Supabase sync error:', err);
    return false;
  }
}
