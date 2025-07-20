-- Insert sample data for testing the timetable functionality

-- Insert sample classes
INSERT INTO public.classes (name, year_id) VALUES 
  ('CS-A', (SELECT id FROM public.years WHERE name = 'First Year' LIMIT 1)),
  ('CS-B', (SELECT id FROM public.years WHERE name = 'First Year' LIMIT 1)),
  ('IT-A', (SELECT id FROM public.years WHERE name = 'Second Year' LIMIT 1)),
  ('IT-B', (SELECT id FROM public.years WHERE name = 'Second Year' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert sample subjects
INSERT INTO public.subjects (name, code) VALUES 
  ('Mathematics', 'MATH101'),
  ('Physics', 'PHY101'),
  ('Computer Science', 'CS101'),
  ('English', 'ENG101'),
  ('Chemistry', 'CHE101'),
  ('Database Systems', 'CS201'),
  ('Data Structures', 'CS202'),
  ('Web Development', 'CS203')
ON CONFLICT DO NOTHING;

-- Insert sample teachers
INSERT INTO public.teachers (name, email, specialization) VALUES 
  ('Dr. John Smith', 'john.smith@university.edu', 'Mathematics'),
  ('Prof. Sarah Johnson', 'sarah.johnson@university.edu', 'Physics'),
  ('Dr. Michael Brown', 'michael.brown@university.edu', 'Computer Science'),
  ('Ms. Emily Davis', 'emily.davis@university.edu', 'English'),
  ('Dr. Robert Wilson', 'robert.wilson@university.edu', 'Chemistry'),
  ('Prof. Lisa Anderson', 'lisa.anderson@university.edu', 'Database Systems'),
  ('Dr. David Martinez', 'david.martinez@university.edu', 'Programming'),
  ('Ms. Jennifer Taylor', 'jennifer.taylor@university.edu', 'Web Development')
ON CONFLICT DO NOTHING;

-- Insert sample classrooms
INSERT INTO public.classrooms (name, capacity, is_lab) VALUES 
  ('Room 101', 50, false),
  ('Room 102', 50, false),
  ('Lab 201', 30, true),
  ('Lab 202', 30, true),
  ('Auditorium A', 100, false),
  ('Room 103', 45, false),
  ('Lab 203', 25, true),
  ('Room 104', 40, false)
ON CONFLICT DO NOTHING;

-- Create subject-class assignments
INSERT INTO public.subject_class_assignments (subject_id, class_id) 
SELECT s.id, c.id 
FROM public.subjects s 
CROSS JOIN public.classes c 
WHERE s.name IN ('Mathematics', 'Physics', 'English')
ON CONFLICT DO NOTHING;

-- Add Computer Science subjects to CS classes
INSERT INTO public.subject_class_assignments (subject_id, class_id) 
SELECT s.id, c.id 
FROM public.subjects s 
CROSS JOIN public.classes c 
WHERE s.name IN ('Computer Science', 'Data Structures', 'Web Development') 
AND c.name LIKE 'CS-%'
ON CONFLICT DO NOTHING;

-- Add IT subjects to IT classes
INSERT INTO public.subject_class_assignments (subject_id, class_id) 
SELECT s.id, c.id 
FROM public.subjects s 
CROSS JOIN public.classes c 
WHERE s.name IN ('Database Systems', 'Web Development', 'Computer Science') 
AND c.name LIKE 'IT-%'
ON CONFLICT DO NOTHING;

-- Create teacher-subject assignments
INSERT INTO public.teacher_subject_assignments (teacher_id, subject_id) VALUES 
  ((SELECT id FROM public.teachers WHERE name = 'Dr. John Smith' LIMIT 1), (SELECT id FROM public.subjects WHERE name = 'Mathematics' LIMIT 1)),
  ((SELECT id FROM public.teachers WHERE name = 'Prof. Sarah Johnson' LIMIT 1), (SELECT id FROM public.subjects WHERE name = 'Physics' LIMIT 1)),
  ((SELECT id FROM public.teachers WHERE name = 'Dr. Michael Brown' LIMIT 1), (SELECT id FROM public.subjects WHERE name = 'Computer Science' LIMIT 1)),
  ((SELECT id FROM public.teachers WHERE name = 'Ms. Emily Davis' LIMIT 1), (SELECT id FROM public.subjects WHERE name = 'English' LIMIT 1)),
  ((SELECT id FROM public.teachers WHERE name = 'Dr. Robert Wilson' LIMIT 1), (SELECT id FROM public.subjects WHERE name = 'Chemistry' LIMIT 1)),
  ((SELECT id FROM public.teachers WHERE name = 'Prof. Lisa Anderson' LIMIT 1), (SELECT id FROM public.subjects WHERE name = 'Database Systems' LIMIT 1)),
  ((SELECT id FROM public.teachers WHERE name = 'Dr. David Martinez' LIMIT 1), (SELECT id FROM public.subjects WHERE name = 'Data Structures' LIMIT 1)),
  ((SELECT id FROM public.teachers WHERE name = 'Ms. Jennifer Taylor' LIMIT 1), (SELECT id FROM public.subjects WHERE name = 'Web Development' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Create a sample timetable
INSERT INTO public.timetables (name, timing_id, created_at) VALUES 
  ('Spring 2024 Timetable', (SELECT id FROM public.timings WHERE name = 'Regular Schedule' LIMIT 1), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample lessons for the timetable
DO $$
DECLARE
    timetable_uuid UUID;
    cs_a_id UUID;
    cs_b_id UUID;
    math_teacher_id UUID;
    cs_teacher_id UUID;
    math_subject_id UUID;
    cs_subject_id UUID;
    room_101_id UUID;
    room_102_id UUID;
    time_slot_1 UUID;
    time_slot_2 UUID;
    time_slot_4 UUID;
    time_slot_5 UUID;
BEGIN
    -- Get IDs
    SELECT id INTO timetable_uuid FROM public.timetables WHERE name = 'Spring 2024 Timetable' LIMIT 1;
    SELECT id INTO cs_a_id FROM public.classes WHERE name = 'CS-A' LIMIT 1;
    SELECT id INTO cs_b_id FROM public.classes WHERE name = 'CS-B' LIMIT 1;
    SELECT id INTO math_teacher_id FROM public.teachers WHERE name = 'Dr. John Smith' LIMIT 1;
    SELECT id INTO cs_teacher_id FROM public.teachers WHERE name = 'Dr. Michael Brown' LIMIT 1;
    SELECT id INTO math_subject_id FROM public.subjects WHERE name = 'Mathematics' LIMIT 1;
    SELECT id INTO cs_subject_id FROM public.subjects WHERE name = 'Computer Science' LIMIT 1;
    SELECT id INTO room_101_id FROM public.classrooms WHERE name = 'Room 101' LIMIT 1;
    SELECT id INTO room_102_id FROM public.classrooms WHERE name = 'Room 102' LIMIT 1;
    
    -- Get time slots (1st, 2nd, 4th, 5th periods - skipping break)
    SELECT id INTO time_slot_1 FROM public.time_slots WHERE timing_id = (SELECT id FROM public.timings WHERE name = 'Regular Schedule' LIMIT 1) AND slot_order = 1;
    SELECT id INTO time_slot_2 FROM public.time_slots WHERE timing_id = (SELECT id FROM public.timings WHERE name = 'Regular Schedule' LIMIT 1) AND slot_order = 2;
    SELECT id INTO time_slot_4 FROM public.time_slots WHERE timing_id = (SELECT id FROM public.timings WHERE name = 'Regular Schedule' LIMIT 1) AND slot_order = 4;
    SELECT id INTO time_slot_5 FROM public.time_slots WHERE timing_id = (SELECT id FROM public.timings WHERE name = 'Regular Schedule' LIMIT 1) AND slot_order = 5;
    
    -- Insert sample lessons if all IDs are found
    IF timetable_uuid IS NOT NULL AND cs_a_id IS NOT NULL AND math_teacher_id IS NOT NULL AND math_subject_id IS NOT NULL AND room_101_id IS NOT NULL AND time_slot_1 IS NOT NULL THEN
        INSERT INTO public.lessons (timetable_id, class_id, subject_id, teacher_id, classroom_id, time_slot_id, day) VALUES 
            -- Monday schedule
            (timetable_uuid, cs_a_id, math_subject_id, math_teacher_id, room_101_id, time_slot_1, 0),
            (timetable_uuid, cs_b_id, cs_subject_id, cs_teacher_id, room_102_id, time_slot_1, 0),
            (timetable_uuid, cs_a_id, cs_subject_id, cs_teacher_id, room_101_id, time_slot_2, 0),
            (timetable_uuid, cs_b_id, math_subject_id, math_teacher_id, room_102_id, time_slot_2, 0),
            
            -- Tuesday schedule  
            (timetable_uuid, cs_a_id, cs_subject_id, cs_teacher_id, room_101_id, time_slot_1, 1),
            (timetable_uuid, cs_b_id, math_subject_id, math_teacher_id, room_102_id, time_slot_1, 1),
            (timetable_uuid, cs_a_id, math_subject_id, math_teacher_id, room_101_id, time_slot_4, 1),
            (timetable_uuid, cs_b_id, cs_subject_id, cs_teacher_id, room_102_id, time_slot_4, 1)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;