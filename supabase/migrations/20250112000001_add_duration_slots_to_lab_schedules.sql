-- Add duration_slots column to lab_schedules table for multi-hour lab support
ALTER TABLE public.lab_schedules 
ADD COLUMN duration_slots INTEGER DEFAULT 1 CHECK (duration_slots IN (1, 2));

-- Update existing lab schedules to have default 1 hour duration
UPDATE public.lab_schedules 
SET duration_slots = 1 
WHERE duration_slots IS NULL;

-- Add index for better performance on duration queries
CREATE INDEX idx_lab_schedules_duration_slots ON public.lab_schedules(duration_slots);

-- Add comment for documentation
COMMENT ON COLUMN public.lab_schedules.duration_slots IS 'Number of consecutive time slots this lab session occupies (1 for regular, 2 for 2-hour labs)';