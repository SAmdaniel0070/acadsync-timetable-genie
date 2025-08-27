-- Add drafts table for saving timetable drafts
CREATE TABLE public.timetable_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year TEXT,
  timing_id UUID NOT NULL,
  year_id UUID,
  draft_data JSONB NOT NULL, -- stores the entire timetable structure as JSON
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.timetable_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable all operations on timetable_drafts" 
ON public.timetable_drafts 
FOR ALL 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_timetable_drafts_updated_at
BEFORE UPDATE ON public.timetable_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add lab_duration_hours column to subjects table to specify lab duration
ALTER TABLE public.subjects 
ADD COLUMN lab_duration_hours INTEGER DEFAULT 1 CHECK (lab_duration_hours IN (1, 2));

-- Update existing lab subjects to have default 1 hour duration
UPDATE public.subjects 
SET lab_duration_hours = 1 
WHERE is_lab = true;