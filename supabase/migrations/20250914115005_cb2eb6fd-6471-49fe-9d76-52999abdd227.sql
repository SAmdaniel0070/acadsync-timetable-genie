-- Create table for batch-specific teacher assignments
CREATE TABLE public.batch_teacher_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL,
  batch_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('theory', 'lab')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subject_id, batch_id, assignment_type)
);

-- Enable RLS
ALTER TABLE public.batch_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for batch teacher assignments
CREATE POLICY "Enable all operations on batch_teacher_assignments" 
ON public.batch_teacher_assignments 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_batch_teacher_assignments_updated_at
BEFORE UPDATE ON public.batch_teacher_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();