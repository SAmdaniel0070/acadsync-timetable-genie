-- Fix critical security vulnerability: Remove public access to timetables table
-- This prevents unauthorized access to share_token and other sensitive timetable data

-- Drop the problematic public read policy
DROP POLICY IF EXISTS "Public can view basic timetable info" ON public.timetables;

-- Ensure only authenticated users can access timetables
-- Keep the existing authenticated policy but make it more explicit
DROP POLICY IF EXISTS "Authenticated users can manage timetables" ON public.timetables;

-- Create separate policies for better granular control
CREATE POLICY "Authenticated users can view timetables" 
ON public.timetables 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create timetables" 
ON public.timetables 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update timetables" 
ON public.timetables 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete timetables" 
ON public.timetables 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create a security definer function for safe share token validation
-- This allows the share-timetable edge function to validate tokens without exposing them
CREATE OR REPLACE FUNCTION public.validate_share_token(token_to_check text)
RETURNS TABLE(
  timetable_id uuid,
  name text,
  academic_year text,
  timing_id uuid,
  year_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.academic_year,
    t.timing_id,
    t.year_id
  FROM public.timetables t
  WHERE t.share_token = token_to_check;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.validate_share_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_share_token(text) TO service_role;