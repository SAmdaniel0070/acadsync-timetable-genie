-- Fix security definer view issues
-- Drop the views that are causing security warnings
DROP VIEW IF EXISTS public.public_timetables;
DROP VIEW IF EXISTS public.public_teachers;

-- Instead of views, we'll use the existing RLS policies to control access
-- The policies already allow public SELECT but hide sensitive columns like share_token and personal info from the application layer