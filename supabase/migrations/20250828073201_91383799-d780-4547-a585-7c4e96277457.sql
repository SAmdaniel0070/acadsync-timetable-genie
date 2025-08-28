-- Add student_count field to classes table
ALTER TABLE public.classes ADD COLUMN student_count INTEGER DEFAULT 0;

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  strength INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on batches table
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for batches
CREATE POLICY "Enable all operations on batches" 
ON public.batches 
FOR ALL 
USING (true);

-- Create unique constraint for batch name within a class
CREATE UNIQUE INDEX idx_unique_batch_per_class ON public.batches(name, class_id);

-- Add trigger for batches updated_at
CREATE TRIGGER update_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();