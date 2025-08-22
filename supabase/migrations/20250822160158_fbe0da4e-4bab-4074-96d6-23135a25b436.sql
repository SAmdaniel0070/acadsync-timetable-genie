-- Add missing columns to subjects table
ALTER TABLE public.subjects 
ADD COLUMN periods_per_week INTEGER NOT NULL DEFAULT 1,
ADD COLUMN is_lab BOOLEAN NOT NULL DEFAULT false;

-- Add missing columns to teachers table for better data import
ALTER TABLE public.teachers 
ADD COLUMN phone TEXT,
ADD COLUMN experience INTEGER;

-- Add location column to classrooms table
ALTER TABLE public.classrooms 
ADD COLUMN location TEXT,
ADD COLUMN equipment TEXT;