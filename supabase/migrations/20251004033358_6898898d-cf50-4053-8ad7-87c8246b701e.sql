-- Add batch_id column to lab_schedules table for batch-specific lab scheduling
ALTER TABLE public.lab_schedules 
ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_lab_schedules_batch_id ON public.lab_schedules(batch_id);

COMMENT ON COLUMN public.lab_schedules.batch_id IS 'Optional batch ID. If NULL, the lab schedule applies to all batches of the class. If set, it applies only to that specific batch.';