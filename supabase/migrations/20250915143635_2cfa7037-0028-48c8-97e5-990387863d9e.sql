-- Fix teacher personal information exposure with correct syntax
-- Drop the overly permissive teacher policy
DROP POLICY IF EXISTS "Public can view basic teacher info" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can manage teachers" ON public.teachers;

-- Only authenticated users can see full teacher details including contact info
CREATE POLICY "Authenticated can view full teacher info" 
ON public.teachers 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Only authenticated users can insert teachers
CREATE POLICY "Authenticated can insert teachers" 
ON public.teachers 
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update teachers
CREATE POLICY "Authenticated can update teachers" 
ON public.teachers 
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can delete teachers
CREATE POLICY "Authenticated can delete teachers" 
ON public.teachers 
FOR DELETE
USING (auth.role() = 'authenticated');

-- Create a function to get safe teacher data for anonymous users
CREATE OR REPLACE FUNCTION public.get_safe_teacher_info()
RETURNS TABLE (
  id uuid,
  name text,
  specialization text,
  experience integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.name,
    t.specialization,
    t.experience,
    t.created_at,
    t.updated_at
  FROM public.teachers t;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_safe_teacher_info() TO anon, authenticated;