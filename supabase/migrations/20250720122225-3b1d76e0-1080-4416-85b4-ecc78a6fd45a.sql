-- Drop policies if they exist first, then recreate
DROP POLICY IF EXISTS "Enable all operations" ON public.years;
DROP POLICY IF EXISTS "Enable all operations" ON public.classes;
DROP POLICY IF EXISTS "Enable all operations" ON public.subjects;
DROP POLICY IF EXISTS "Enable all operations" ON public.teachers;
DROP POLICY IF EXISTS "Enable all operations" ON public.classrooms;
DROP POLICY IF EXISTS "Enable all operations" ON public.timings;
DROP POLICY IF EXISTS "Enable all operations" ON public.time_slots;
DROP POLICY IF EXISTS "Enable all operations" ON public.timetables;
DROP POLICY IF EXISTS "Enable all operations" ON public.lessons;
DROP POLICY IF EXISTS "Enable all operations" ON public.subject_class_assignments;
DROP POLICY IF EXISTS "Enable all operations" ON public.teacher_subject_assignments;

-- Create policies without IF NOT EXISTS
CREATE POLICY "Enable all operations" ON public.years FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.classes FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.subjects FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.teachers FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.classrooms FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.timings FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.time_slots FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.timetables FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.lessons FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.subject_class_assignments FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.teacher_subject_assignments FOR ALL USING (true);

-- Insert sample data
INSERT INTO public.years (name) VALUES 
  ('First Year'),
  ('Second Year'),
  ('Third Year'),
  ('Fourth Year')
ON CONFLICT DO NOTHING;

-- Insert sample timing
INSERT INTO public.timings (name, periods) VALUES 
  ('Regular Schedule', '[
    {"start": "09:00", "end": "10:00", "isBreak": false},
    {"start": "10:00", "end": "11:00", "isBreak": false},
    {"start": "11:00", "end": "11:15", "isBreak": true},
    {"start": "11:15", "end": "12:15", "isBreak": false},
    {"start": "12:15", "end": "13:15", "isBreak": false},
    {"start": "13:15", "end": "14:00", "isBreak": true},
    {"start": "14:00", "end": "15:00", "isBreak": false},
    {"start": "15:00", "end": "16:00", "isBreak": false}
  ]')
ON CONFLICT DO NOTHING;

-- Insert time slots manually
DO $$
DECLARE
    timing_uuid UUID;
BEGIN
    SELECT id INTO timing_uuid FROM public.timings WHERE name = 'Regular Schedule' LIMIT 1;
    
    IF timing_uuid IS NOT NULL THEN
        INSERT INTO public.time_slots (timing_id, start_time, end_time, is_break, slot_order) VALUES 
            (timing_uuid, '09:00'::time, '10:00'::time, false, 1),
            (timing_uuid, '10:00'::time, '11:00'::time, false, 2),
            (timing_uuid, '11:00'::time, '11:15'::time, true, 3),
            (timing_uuid, '11:15'::time, '12:15'::time, false, 4),
            (timing_uuid, '12:15'::time, '13:15'::time, false, 5),
            (timing_uuid, '13:15'::time, '14:00'::time, true, 6),
            (timing_uuid, '14:00'::time, '15:00'::time, false, 7),
            (timing_uuid, '15:00'::time, '16:00'::time, false, 8)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;