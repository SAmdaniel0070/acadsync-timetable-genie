import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LabSchedule {
  subject_id: string;
  class_id: string;
  batch_id: string;
  day: number;
  time_slot_id: string;
  teacher_id: string;
  classroom_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting lab schedule assignment...');

    // Fetch all required data
    const [subjectsRes, classesRes, batchesRes, teachersRes, classroomsRes, timeSlotsRes, assignmentsRes] = await Promise.all([
      supabase.from('subjects').select('*').eq('is_lab', true),
      supabase.from('classes').select('*'),
      supabase.from('batches').select('*'),
      supabase.from('teachers').select('*'),
      supabase.from('classrooms').select('*').eq('is_lab', true),
      supabase.from('time_slots').select('*').eq('is_break', false).order('slot_order'),
      supabase.from('subject_class_assignments').select('*')
    ]);

    if (subjectsRes.error) throw subjectsRes.error;
    if (classesRes.error) throw classesRes.error;
    if (batchesRes.error) throw batchesRes.error;
    if (teachersRes.error) throw teachersRes.error;
    if (classroomsRes.error) throw classroomsRes.error;
    if (timeSlotsRes.error) throw timeSlotsRes.error;
    if (assignmentsRes.error) throw assignmentsRes.error;

    const subjects = subjectsRes.data;
    const classes = classesRes.data;
    const batches = batchesRes.data;
    const teachers = teachersRes.data;
    const labClassrooms = classroomsRes.data;
    const timeSlots = timeSlotsRes.data;
    const assignments = assignmentsRes.data;

    console.log(`Found ${subjects.length} lab subjects, ${classes.length} classes, ${batches.length} batches, ${labClassrooms.length} lab classrooms`);

    // Clear existing lab schedules
    const { error: deleteError } = await supabase.from('lab_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) throw deleteError;

    const labSchedules: LabSchedule[] = [];
    let scheduleIndex = 0;
    const workingDays = [0, 1, 2, 3, 4]; // Monday to Friday

    // Process each class
    for (const classItem of classes) {
      const classBatches = batches.filter(b => b.class_id === classItem.id);
      const classSubjects = assignments
        .filter(a => a.class_id === classItem.id)
        .map(a => subjects.find(s => s.id === a.subject_id))
        .filter(s => s !== undefined);

      console.log(`Processing ${classItem.name}: ${classSubjects.length} lab subjects, ${classBatches.length} batches`);

      // For each lab subject assigned to this class
      for (const subject of classSubjects) {
        // Assign each batch to a different slot
        classBatches.forEach((batch, batchIndex) => {
          const dayIndex = Math.floor(scheduleIndex / timeSlots.length) % workingDays.length;
          const slotIndex = scheduleIndex % timeSlots.length;
          const classroomIndex = scheduleIndex % labClassrooms.length;
          const teacherIndex = scheduleIndex % teachers.length;

          labSchedules.push({
            subject_id: subject.id,
            class_id: classItem.id,
            batch_id: batch.id,
            day: workingDays[dayIndex],
            time_slot_id: timeSlots[slotIndex].id,
            teacher_id: teachers[teacherIndex].id,
            classroom_id: labClassrooms[classroomIndex].id,
          });

          scheduleIndex++;
        });
      }
    }

    console.log(`Generated ${labSchedules.length} lab schedules. Inserting into database...`);

    // Insert all schedules in batches of 100
    const batchSize = 100;
    for (let i = 0; i < labSchedules.length; i += batchSize) {
      const batch = labSchedules.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from('lab_schedules').insert(batch);
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(labSchedules.length / batchSize)}`);
    }

    console.log('Lab schedule assignment completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully assigned ${labSchedules.length} lab schedules`,
        count: labSchedules.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error assigning lab schedules:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
