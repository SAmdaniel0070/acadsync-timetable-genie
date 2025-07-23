-- Create class_classroom_assignments table to track which classes are assigned to which classrooms
CREATE TABLE public.class_classroom_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  classroom_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab_schedules table to track lab assignments to teachers, subjects, and time slots
CREATE TABLE public.lab_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  time_slot_id UUID NOT NULL,
  day INTEGER NOT NULL, -- 0 for Monday, 1 for Tuesday, etc.
  class_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.class_classroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for class_classroom_assignments
CREATE POLICY "Enable all operations on class_classroom_assignments" 
ON public.class_classroom_assignments 
FOR ALL 
USING (true);

-- Create policies for lab_schedules
CREATE POLICY "Enable all operations on lab_schedules" 
ON public.lab_schedules 
FOR ALL 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_class_classroom_assignments_updated_at
BEFORE UPDATE ON public.class_classroom_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lab_schedules_updated_at
BEFORE UPDATE ON public.lab_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_class_classroom_assignments_class_id ON public.class_classroom_assignments(class_id);
CREATE INDEX idx_class_classroom_assignments_classroom_id ON public.class_classroom_assignments(classroom_id);
CREATE INDEX idx_lab_schedules_classroom_id ON public.lab_schedules(classroom_id);
CREATE INDEX idx_lab_schedules_teacher_id ON public.lab_schedules(teacher_id);
CREATE INDEX idx_lab_schedules_subject_id ON public.lab_schedules(subject_id);
CREATE INDEX idx_lab_schedules_time_slot_id ON public.lab_schedules(time_slot_id);
CREATE INDEX idx_lab_schedules_day ON public.lab_schedules(day);