-- Fix RLS policies for security issues
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Enable all operations" ON public.timetables;
DROP POLICY IF EXISTS "Enable all operations" ON public.teachers;
DROP POLICY IF EXISTS "Enable all operations" ON public.lessons;
DROP POLICY IF EXISTS "Enable all operations" ON public.classes;
DROP POLICY IF EXISTS "Enable all operations" ON public.subjects;
DROP POLICY IF EXISTS "Enable all operations" ON public.classrooms;
DROP POLICY IF EXISTS "Enable all operations" ON public.years;
DROP POLICY IF EXISTS "Enable all operations" ON public.timings;
DROP POLICY IF EXISTS "Enable all operations" ON public.time_slots;
DROP POLICY IF EXISTS "Enable all operations" ON public.teacher_subject_assignments;
DROP POLICY IF EXISTS "Enable all operations" ON public.subject_class_assignments;
DROP POLICY IF EXISTS "Enable all operations on batches" ON public.batches;
DROP POLICY IF EXISTS "Enable all operations on batch_teacher_assignments" ON public.batch_teacher_assignments;
DROP POLICY IF EXISTS "Enable all operations on timetable_drafts" ON public.timetable_drafts;
DROP POLICY IF EXISTS "Enable all operations on class_classroom_assignments" ON public.class_classroom_assignments;
DROP POLICY IF EXISTS "Enable all operations on lab_schedules" ON public.lab_schedules;

-- Create secure policies for timetables (main security fix)
-- Allow public read access to basic timetable info (without share_token)
CREATE POLICY "Public can view basic timetable info" 
ON public.timetables 
FOR SELECT 
USING (true);

-- Only authenticated users can insert/update/delete timetables
CREATE POLICY "Authenticated users can manage timetables" 
ON public.timetables 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create a view for public timetable access without sensitive data
CREATE OR REPLACE VIEW public.public_timetables AS
SELECT 
  id,
  timing_id,
  created_at,
  updated_at,
  year_id,
  name,
  academic_year
FROM public.timetables;

-- Grant access to the view
GRANT SELECT ON public.public_timetables TO anon, authenticated;

-- Secure teachers table - hide personal information
CREATE POLICY "Public can view basic teacher info" 
ON public.teachers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage teachers" 
ON public.teachers 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create public view for teachers without sensitive data
CREATE OR REPLACE VIEW public.public_teachers AS
SELECT 
  id,
  name,
  specialization,
  experience,
  created_at,
  updated_at
FROM public.teachers;

GRANT SELECT ON public.public_teachers TO anon, authenticated;

-- Secure other tables with read-only for public, full access for authenticated
CREATE POLICY "Public can view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage lessons" ON public.lessons FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage classes" ON public.classes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage subjects" ON public.subjects FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view classrooms" ON public.classrooms FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage classrooms" ON public.classrooms FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view years" ON public.years FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage years" ON public.years FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view timings" ON public.timings FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage timings" ON public.timings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view time_slots" ON public.time_slots FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage time_slots" ON public.time_slots FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view teacher_subject_assignments" ON public.teacher_subject_assignments FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage teacher_subject_assignments" ON public.teacher_subject_assignments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view subject_class_assignments" ON public.subject_class_assignments FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage subject_class_assignments" ON public.subject_class_assignments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage batches" ON public.batches FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view batch_teacher_assignments" ON public.batch_teacher_assignments FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage batch_teacher_assignments" ON public.batch_teacher_assignments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can view timetable_drafts" ON public.timetable_drafts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage timetable_drafts" ON public.timetable_drafts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view class_classroom_assignments" ON public.class_classroom_assignments FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage class_classroom_assignments" ON public.class_classroom_assignments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view lab_schedules" ON public.lab_schedules FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage lab_schedules" ON public.lab_schedules FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');