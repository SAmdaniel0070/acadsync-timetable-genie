-- Create Years table
CREATE TABLE public.years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year_id UUID REFERENCES public.years(id) ON DELETE CASCADE,
  capacity INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  periods_per_week INTEGER DEFAULT 1,
  is_lab BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  max_periods_per_day INTEGER DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 50,
  is_lab BOOLEAN DEFAULT false,
  equipment TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Timings table
CREATE TABLE public.timings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  periods JSONB NOT NULL, -- Array of time periods
  working_days INTEGER[] DEFAULT '{0,1,2,3,4}', -- 0=Monday, 1=Tuesday, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Time Slots table
CREATE TABLE public.time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timing_id UUID REFERENCES public.timings(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_break BOOLEAN DEFAULT false,
  slot_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Subject-Class assignments
CREATE TABLE public.subject_class_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subject_id, class_id)
);

-- Create Teacher-Subject assignments
CREATE TABLE public.teacher_subject_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);

-- Create Timetables table
CREATE TABLE public.timetables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  year_id UUID REFERENCES public.years(id),
  timing_id UUID REFERENCES public.timings(id) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timetable_id UUID REFERENCES public.timetables(id) ON DELETE CASCADE,
  day INTEGER NOT NULL, -- 0=Monday, 1=Tuesday, etc.
  time_slot_id UUID REFERENCES public.time_slots(id),
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  teacher_id UUID REFERENCES public.teachers(id),
  classroom_id UUID REFERENCES public.classrooms(id),
  batch_id UUID, -- For future batch support
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust for production)
CREATE POLICY "Enable all access for all users" ON public.years FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.classes FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.subjects FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.teachers FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.classrooms FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.timings FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.time_slots FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.subject_class_assignments FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.teacher_subject_assignments FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.timetables FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.lessons FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_years_updated_at BEFORE UPDATE ON public.years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timings_updated_at BEFORE UPDATE ON public.timings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON public.time_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON public.timetables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_lessons_timetable_id ON public.lessons(timetable_id);
CREATE INDEX idx_lessons_day_time_slot ON public.lessons(day, time_slot_id);
CREATE INDEX idx_lessons_class_id ON public.lessons(class_id);
CREATE INDEX idx_lessons_teacher_id ON public.lessons(teacher_id);
CREATE INDEX idx_lessons_classroom_id ON public.lessons(classroom_id);
CREATE INDEX idx_timetables_share_token ON public.timetables(share_token);
CREATE INDEX idx_timetables_is_active ON public.timetables(is_active);

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO public.years (name) VALUES 
  ('First Year'),
  ('Second Year'),
  ('Third Year'),
  ('Fourth Year');

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
  ]');

-- Get the timing ID for time slots
WITH timing_data AS (
  SELECT id, periods::jsonb as periods_json FROM public.timings WHERE name = 'Regular Schedule'
)
INSERT INTO public.time_slots (timing_id, start_time, end_time, is_break, slot_order)
SELECT 
  timing_data.id,
  (period->>'start')::time,
  (period->>'end')::time,
  (period->>'isBreak')::boolean,
  ordinality
FROM timing_data, 
     jsonb_array_elements(timing_data.periods_json) WITH ORDINALITY AS period;