import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimetableGenerationRequest {
  name: string;
  academicYear: string;
  yearId?: string;
  timingId: string;
}

interface ConflictCheckResult {
  teacherConflict: boolean;
  classConflict: boolean;
  classroomConflict: boolean;
}

// Timetable generation algorithm
class TimetableGenerator {
  private supabase: any;
  
  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  // Check for conflicts when scheduling a lesson
  async checkConflicts(
    day: number,
    timeSlotId: string,
    teacherId: string,
    classId: string,
    classroomId: string | null,
    existingLessons: any[]
  ): Promise<ConflictCheckResult> {
    const conflicts = existingLessons.filter(lesson => 
      lesson.day === day && lesson.time_slot_id === timeSlotId
    );

    return {
      teacherConflict: conflicts.some(lesson => lesson.teacher_id === teacherId),
      classConflict: conflicts.some(lesson => lesson.class_id === classId),
      classroomConflict: classroomId ? conflicts.some(lesson => lesson.classroom_id === classroomId) : false
    };
  }

  // Find suitable classroom for a subject
  findSuitableClassroom(
    subject: any,
    classrooms: any[],
    day: number,
    timeSlotId: string,
    existingLessons: any[]
  ): any | null {
    if (!classrooms || classrooms.length === 0) return null;

    // Filter available classrooms
    const availableClassrooms = classrooms.filter(classroom => {
      const isOccupied = existingLessons.some(lesson => 
        lesson.day === day && 
        lesson.time_slot_id === timeSlotId && 
        lesson.classroom_id === classroom.id
      );
      
      const isCompatible = subject.is_lab ? classroom.is_lab : !classroom.is_lab;
      
      return !isOccupied && isCompatible;
    });

    if (availableClassrooms.length === 0) return null;

    // Return smallest suitable classroom
    return availableClassrooms.sort((a, b) => a.capacity - b.capacity)[0];
  }

  // Shuffle array for randomization
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Main timetable generation logic
  async generateTimetable(request: TimetableGenerationRequest): Promise<any> {
    console.log('Starting timetable generation for:', request.name);

    // Fetch all required data
    const [classesData, subjectsData, teachersData, timeSlotsData, classroomsData, assignmentsData, teacherSubjectsData] = await Promise.all([
      this.supabase.from('classes').select('*'),
      this.supabase.from('subjects').select('*'),
      this.supabase.from('teachers').select('*'),
      this.supabase.from('time_slots').select('*').eq('timing_id', request.timingId).order('slot_order'),
      this.supabase.from('classrooms').select('*'),
      this.supabase.from('subject_class_assignments').select('*'),
      this.supabase.from('teacher_subject_assignments').select('*')
    ]);

    if (classesData.error || subjectsData.error || teachersData.error || timeSlotsData.error) {
      throw new Error('Failed to fetch required data');
    }

    const classes = classesData.data || [];
    const subjects = subjectsData.data || [];
    const teachers = teachersData.data || [];
    const timeSlots = (timeSlotsData.data || []).filter(slot => !slot.is_break);
    const classrooms = classroomsData.data || [];
    const assignments = assignmentsData.data || [];
    const teacherSubjects = teacherSubjectsData.data || [];

    console.log(`Found ${classes.length} classes, ${subjects.length} subjects, ${teachers.length} teachers`);

    // Create timetable record
    const { data: timetableData, error: timetableError } = await this.supabase
      .from('timetables')
      .insert({
        name: request.name,
        academic_year: request.academicYear,
        year_id: request.yearId,
        timing_id: request.timingId,
        share_token: crypto.randomUUID().replace(/-/g, '').substring(0, 16)
      })
      .select()
      .single();

    if (timetableError) {
      throw new Error(`Failed to create timetable: ${timetableError.message}`);
    }

    const timetableId = timetableData.id;
    const lessons: any[] = [];
    const workingDays = [0, 1, 2, 3, 4]; // Monday to Friday

    // Generate lessons for each class
    for (const cls of classes) {
      console.log(`Generating lessons for class: ${cls.name}`);
      
      // Get subjects assigned to this class
      const classSubjects = subjects.filter(subject =>
        assignments.some(assignment => 
          assignment.class_id === cls.id && assignment.subject_id === subject.id
        )
      );

      console.log(`Class ${cls.name} has ${classSubjects.length} subjects`);

      // For each subject, schedule the required periods
      for (const subject of classSubjects) {
        const periodsRequired = subject.periods_per_week || 1;
        let periodsScheduled = 0;
        let attempts = 0;
        const maxAttempts = 50;

        // Get teachers who can teach this subject
        const eligibleTeachers = teachers.filter(teacher =>
          teacherSubjects.some(ts => 
            ts.teacher_id === teacher.id && ts.subject_id === subject.id
          )
        );

        if (eligibleTeachers.length === 0) {
          console.warn(`No teachers found for subject ${subject.name} in class ${cls.name}`);
          continue;
        }

        while (periodsScheduled < periodsRequired && attempts < maxAttempts) {
          attempts++;

          // Try random days and time slots
          const shuffledDays = this.shuffleArray(workingDays);
          const shuffledTimeSlots = this.shuffleArray(timeSlots);
          const shuffledTeachers = this.shuffleArray(eligibleTeachers);

          let lessonScheduled = false;

          for (const day of shuffledDays) {
            if (lessonScheduled) break;

            for (const timeSlot of shuffledTimeSlots) {
              if (lessonScheduled) break;

              for (const teacher of shuffledTeachers) {
                const conflicts = await this.checkConflicts(
                  day,
                  timeSlot.id,
                  teacher.id,
                  cls.id,
                  null,
                  lessons
                );

                if (!conflicts.teacherConflict && !conflicts.classConflict) {
                  // Find suitable classroom
                  const classroom = this.findSuitableClassroom(
                    subject,
                    classrooms,
                    day,
                    timeSlot.id,
                    lessons
                  );

                  // Create lesson
                  const newLesson = {
                    timetable_id: timetableId,
                    day: day,
                    time_slot_id: timeSlot.id,
                    class_id: cls.id,
                    subject_id: subject.id,
                    teacher_id: teacher.id,
                    classroom_id: classroom?.id || null
                  };

                  lessons.push(newLesson);
                  periodsScheduled++;
                  lessonScheduled = true;
                  break;
                }
              }
            }
          }
        }

        if (periodsScheduled < periodsRequired) {
          console.warn(`Could only schedule ${periodsScheduled}/${periodsRequired} periods for ${subject.name} in ${cls.name}`);
        }
      }
    }

    console.log(`Generated ${lessons.length} lessons total`);

    // Save lessons to database
    if (lessons.length > 0) {
      const { error: lessonsError } = await this.supabase
        .from('lessons')
        .insert(lessons);

      if (lessonsError) {
        throw new Error(`Failed to save lessons: ${lessonsError.message}`);
      }
    }

    // Return complete timetable
    const { data: completeTimetable } = await this.supabase
      .from('timetables')
      .select(`
        *,
        lessons (
          *,
          classes (name),
          subjects (name, code),
          teachers (name),
          classrooms (name),
          time_slots (start_time, end_time, slot_order)
        )
      `)
      .eq('id', timetableId)
      .single();

    return completeTimetable;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Timetable generation request received');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: TimetableGenerationRequest = await req.json();
    console.log('Generation request:', request);

    const generator = new TimetableGenerator(supabase);
    const timetable = await generator.generateTimetable(request);

    console.log('Timetable generated successfully');

    return new Response(JSON.stringify(timetable), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error generating timetable:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate timetable',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);