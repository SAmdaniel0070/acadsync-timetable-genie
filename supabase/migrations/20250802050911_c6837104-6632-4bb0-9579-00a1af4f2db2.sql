-- Add missing columns to timetables table
ALTER TABLE public.timetables 
ADD COLUMN academic_year TEXT,
ADD COLUMN year_id UUID REFERENCES public.years(id),
ADD COLUMN share_token TEXT UNIQUE;