-- =====================================================================
-- 🧪 Solafios Mediflow — Supabase Database Setup & Schema
-- Generated: 2026-10-07 for Solafios Mediflow (Dr. Eslam)
-- =====================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Table: medicines
-- Stores medication profiles and prescription details
-- ---------------------------------------------------------------------
create table if not exists public.medicines (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade default auth.uid(),
    name text not null,
    strength text,
    dose text not null,
    pills_per_dose integer not null default 1,
    times_per_day integer not null default 1,
    schedule text not null, -- 'before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch', 'before_dinner', 'after_dinner', 'before_sleep', 'after_wake', 'custom_interval'
    first_dose_time timestamptz not null default now(),
    duration integer not null default 7, -- duration in days
    notes text,
    type text not null default 'tablet', -- 'tablet', 'syrup', 'injection', 'drops', 'cream', 'inhaler'
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Table: doses_schedule
-- Stores individual scheduled dose occurrences
-- ---------------------------------------------------------------------
create table if not exists public.doses_schedule (
    id uuid primary key default uuid_generate_v4(),
    medicine_id uuid not null references public.medicines(id) on delete cascade,
    dose_time timestamptz not null,
    taken boolean not null default false,
    taken_at timestamptz,
    skipped boolean not null default false,
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Table: reminders
-- Stores alert notifications for upcoming doses
-- ---------------------------------------------------------------------
create table if not exists public.reminders (
    id uuid primary key default uuid_generate_v4(),
    medicine_id uuid not null references public.medicines(id) on delete cascade,
    reminder_time timestamptz not null,
    status text not null default 'pending', -- 'pending', 'sent', 'acknowledged', 'dismissed'
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Table: user_settings (for meal times & preferences)
-- ---------------------------------------------------------------------
create table if not exists public.user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
    breakfast_time text not null default '08:00',
    lunch_time text not null default '14:00',
    dinner_time text not null default '20:00',
    sleep_time text not null default '23:00',
    wake_time text not null default '07:00',
    sound_enabled boolean not null default true,
    vibration_enabled boolean not null default true,
    updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes for performance
-- ---------------------------------------------------------------------
create index if not exists idx_medicines_user_id on public.medicines(user_id);
create index if not exists idx_medicines_created_at on public.medicines(created_at);
create index if not exists idx_doses_medicine_id on public.doses_schedule(medicine_id);
create index if not exists idx_doses_dose_time on public.doses_schedule(dose_time);
create index if not exists idx_doses_taken on public.doses_schedule(taken);
create index if not exists idx_reminders_medicine_id on public.reminders(medicine_id);
create index if not exists idx_reminders_time on public.reminders(reminder_time);

-- ---------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ---------------------------------------------------------------------
alter table public.medicines enable row level security;
alter table public.doses_schedule enable row level security;
alter table public.reminders enable row level security;
alter table public.user_settings enable row level security;

-- Policies for medicines
create policy "Users can view their own medicines"
    on public.medicines for select
    using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can insert their own medicines"
    on public.medicines for insert
    with check (auth.uid() = user_id or auth.uid() is null);

create policy "Users can update their own medicines"
    on public.medicines for update
    using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can delete their own medicines"
    on public.medicines for delete
    using (auth.uid() = user_id or auth.uid() is null);

-- Policies for doses_schedule
create policy "Users can manage their doses"
    on public.doses_schedule for all
    using (
        exists (
            select 1 from public.medicines m
            where m.id = doses_schedule.medicine_id
            and (m.user_id = auth.uid() or auth.uid() is null)
        )
    );

-- Policies for reminders
create policy "Users can manage their reminders"
    on public.reminders for all
    using (
        exists (
            select 1 from public.medicines m
            where m.id = reminders.medicine_id
            and (m.user_id = auth.uid() or auth.uid() is null)
        )
    );

-- Policies for user_settings
create policy "Users can manage their settings"
    on public.user_settings for all
    using (auth.uid() = user_id or auth.uid() is null);
