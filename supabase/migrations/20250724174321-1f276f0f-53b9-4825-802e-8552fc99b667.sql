-- Add foreign key constraints for class_classroom_assignments table
ALTER TABLE public.class_classroom_assignments 
ADD CONSTRAINT fk_class_classroom_assignments_class_id 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.class_classroom_assignments 
ADD CONSTRAINT fk_class_classroom_assignments_classroom_id 
FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE;

-- Add foreign key constraints for lab_schedules table
ALTER TABLE public.lab_schedules 
ADD CONSTRAINT fk_lab_schedules_classroom_id 
FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE;

ALTER TABLE public.lab_schedules 
ADD CONSTRAINT fk_lab_schedules_teacher_id 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.lab_schedules 
ADD CONSTRAINT fk_lab_schedules_subject_id 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.lab_schedules 
ADD CONSTRAINT fk_lab_schedules_time_slot_id 
FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id) ON DELETE CASCADE;

ALTER TABLE public.lab_schedules 
ADD CONSTRAINT fk_lab_schedules_class_id 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;