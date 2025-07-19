-- Fix the time slots insertion with proper JSONB handling
WITH timing_data AS (
  SELECT id FROM public.timings WHERE name = 'Regular Schedule'
)
INSERT INTO public.time_slots (timing_id, start_time, end_time, is_break, slot_order)
SELECT 
  timing_data.id,
  '09:00'::time, '10:00'::time, false, 1
FROM timing_data
UNION ALL
SELECT 
  timing_data.id,
  '10:00'::time, '11:00'::time, false, 2
FROM timing_data
UNION ALL
SELECT 
  timing_data.id,
  '11:00'::time, '11:15'::time, true, 3
FROM timing_data
UNION ALL
SELECT 
  timing_data.id,
  '11:15'::time, '12:15'::time, false, 4
FROM timing_data
UNION ALL
SELECT 
  timing_data.id,
  '12:15'::time, '13:15'::time, false, 5
FROM timing_data
UNION ALL
SELECT 
  timing_data.id,
  '13:15'::time, '14:00'::time, true, 6
FROM timing_data
UNION ALL
SELECT 
  timing_data.id,
  '14:00'::time, '15:00'::time, false, 7
FROM timing_data
UNION ALL
SELECT 
  timing_data.id,
  '15:00'::time, '16:00'::time, false, 8
FROM timing_data;