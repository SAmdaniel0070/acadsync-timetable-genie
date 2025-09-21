-- Fix security vulnerability: Remove public access to teachers table
-- This ensures teacher personal information (email, phone) is only accessible to authenticated users

-- First, let's drop any existing public read policies for teachers table
DROP POLICY IF EXISTS "Public can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Anyone can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teachers;

-- Ensure only authenticated users can view teacher information
-- The existing "Authenticated can view full teacher info" policy should remain
-- But let's recreate it to be explicit about the security requirement
DROP POLICY IF EXISTS "Authenticated can view full teacher info" ON public.teachers;

CREATE POLICY "Authenticated users can view teacher info" 
ON public.teachers 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- For extra security, we can also create a function that returns safe teacher info
-- that excludes sensitive details for less privileged contexts if needed
CREATE OR REPLACE FUNCTION public.get_safe_teacher_info()
RETURNS TABLE(
  id uuid,
  name text,
  specialization text,
  experience integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
  SELECT 
    t.id,
    t.name,
    t.specialization,
    t.experience,
    t.created_at,
    t.updated_at
  FROM public.teachers t;
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;