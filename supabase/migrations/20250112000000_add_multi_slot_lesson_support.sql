-- Add support for multi-slot lessons (2-hour labs)
-- This migration adds fields to track lesson duration and continuation slots

-- Add new columns to lessons table
ALTER TABLE public.lessons 
ADD COLUMN duration_slots INTEGER DEFAULT 1 CHECK (duration_slots IN (1, 2)),
ADD COLUMN is_continuation BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Add index for better performance when querying continuation lessons
CREATE INDEX idx_lessons_parent_lesson_id ON public.lessons(parent_lesson_id);
CREATE INDEX idx_lessons_continuation ON public.lessons(is_continuation);

-- Add comment explaining the new fields
COMMENT ON COLUMN public.lessons.duration_slots IS 'Number of consecutive time slots this lesson occupies (1 for regular, 2 for 2-hour labs)';
COMMENT ON COLUMN public.lessons.is_continuation IS 'True if this is a continuation slot of a multi-slot lesson';
COMMENT ON COLUMN public.lessons.parent_lesson_id IS 'ID of the parent lesson for continuation slots';

-- Update existing lessons to have default values
UPDATE public.lessons 
SET duration_slots = 1, is_continuation = FALSE 
WHERE duration_slots IS NULL OR is_continuation IS NULL;

-- Create a function to automatically create continuation lessons for 2-hour labs
CREATE OR REPLACE FUNCTION create_continuation_lesson()
RETURNS TRIGGER AS $$
DECLARE
    next_slot_id UUID;
    next_slot_order INTEGER;
    current_slot_order INTEGER;
    subject_lab_duration INTEGER;
BEGIN
    -- Only process if this is a new lesson (not an update) and not already a continuation
    IF TG_OP = 'INSERT' AND NOT NEW.is_continuation THEN
        -- Get the subject's lab duration
        SELECT lab_duration_hours INTO subject_lab_duration
        FROM subjects 
        WHERE id = NEW.subject_id AND is_lab = TRUE;
        
        -- If it's a 2-hour lab, create continuation lesson
        IF subject_lab_duration = 2 THEN
            -- Get current slot order
            SELECT slot_order INTO current_slot_order
            FROM time_slots 
            WHERE id = NEW.time_slot_id;
            
            -- Find next consecutive slot
            SELECT id INTO next_slot_id
            FROM time_slots 
            WHERE timing_id = (SELECT timing_id FROM time_slots WHERE id = NEW.time_slot_id)
            AND slot_order = current_slot_order + 1
            AND is_break = FALSE;
            
            -- Create continuation lesson if next slot exists
            IF next_slot_id IS NOT NULL THEN
                INSERT INTO lessons (
                    timetable_id,
                    day,
                    time_slot_id,
                    class_id,
                    subject_id,
                    teacher_id,
                    classroom_id,
                    duration_slots,
                    is_continuation,
                    parent_lesson_id
                ) VALUES (
                    NEW.timetable_id,
                    NEW.day,
                    next_slot_id,
                    NEW.class_id,
                    NEW.subject_id,
                    NEW.teacher_id,
                    NEW.classroom_id,
                    1, -- Continuation slot is always 1 slot
                    TRUE,
                    NEW.id
                );
                
                -- Update parent lesson to indicate it spans 2 slots
                UPDATE lessons 
                SET duration_slots = 2 
                WHERE id = NEW.id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically handle 2-hour lab continuation
CREATE TRIGGER trigger_create_continuation_lesson
    AFTER INSERT ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION create_continuation_lesson();

-- Create a function to clean up continuation lessons when parent is deleted
CREATE OR REPLACE FUNCTION cleanup_continuation_lessons()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete any continuation lessons that reference this lesson
    DELETE FROM lessons 
    WHERE parent_lesson_id = OLD.id AND is_continuation = TRUE;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up continuation lessons
CREATE TRIGGER trigger_cleanup_continuation_lessons
    BEFORE DELETE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_continuation_lessons();