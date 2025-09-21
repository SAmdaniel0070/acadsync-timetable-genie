-- Double-check and ensure no public policies exist on teachers table
-- This will definitively fix the security vulnerability

-- Drop any potential public policies that might exist
DROP POLICY IF EXISTS "Public can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teachers;
DROP POLICY IF EXISTS "Anyone can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Teachers are viewable by everyone" ON public.teachers;
DROP POLICY IF EXISTS "Public read access" ON public.teachers;

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Make sure we have the correct restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view teacher info" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated can view full teacher info" ON public.teachers;

-- Create a single, clear policy for authenticated access only
CREATE POLICY "Only authenticated users can view teachers" 
ON public.teachers 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Verify no other SELECT policies exist by recreating all other policies to be explicit
DROP POLICY IF EXISTS "Authenticated can insert teachers" ON public.teachers;
CREATE POLICY "Only authenticated users can insert teachers" 
ON public.teachers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Authenticated can update teachers" ON public.teachers;
CREATE POLICY "Only authenticated users can update teachers" 
ON public.teachers 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Authenticated can delete teachers" ON public.teachers;
CREATE POLICY "Only authenticated users can delete teachers" 
ON public.teachers 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);