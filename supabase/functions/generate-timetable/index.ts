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
  backToBackConflict: boolean;
  teacherDailyLimitExceeded: boolean;
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
    subjectId: string,
    classroomId: string | null,
    existingLessons: any[],
    timeSlots: any[]
  ): Promise<ConflictCheckResult> {
    const conflicts = existingLessons.filter(lesson => 
      lesson.day === day && lesson.time_slot_id === timeSlotId
    );

    // Check for back-to-back lectures constraint
    const currentSlotOrder = timeSlots.find(slot => slot.id === timeSlotId)?.slot_order || 0;
    const hasBackToBackConflict = existingLessons.some(lesson => {
      if (lesson.day === day && lesson.teacher_id === teacherId && 
          lesson.class_id === classId && lesson.subject_id === subjectId) {
        const lessonSlotOrder = timeSlots.find(slot => slot.id === lesson.time_slot_id)?.slot_order || 0;
        // Check if it's immediately before or after current slot
        return Math.abs(lessonSlotOrder - currentSlotOrder) === 1;
      }
      return false;
    });

    // Check teacher's daily class limit (max 4 classes per day)
    const teacherDailyLessons = existingLessons.filter(lesson => 
      lesson.day === day && lesson.teacher_id === teacherId
    ).length;
    const teacherDailyLimitExceeded = teacherDailyLessons >= 4;

    return {
      teacherConflict: conflicts.some(lesson => lesson.teacher_id === teacherId),
      classConflict: conflicts.some(lesson => lesson.class_id === classId),
      classroomConflict: classroomId ? conflicts.some(lesson => lesson.classroom_id === classroomId) : false,
      backToBackConflict: hasBackToBackConflict,
      teacherDailyLimitExceeded
    };
  }

  // Find suitable classroom for a subject and class
  findSuitableClassroom(
    subject: any,
    classId: string,
    classrooms: any[],
    classroomAssignments: any[],
    labSchedules: any[],
    day: number,
    timeSlotId: string,
    existingLessons: any[]
  ): any | null {
    if (!classrooms || classrooms.length === 0) return null;

    // First check if this class has a dedicated classroom assignment
    const classroomAssignment = classroomAssignments.find(assignment => 
      assignment.class_id === classId
    );

    let preferredClassrooms = classrooms;
    
    if (classroomAssignment) {
      // Use assigned classroom if available
      const assignedClassroom = classrooms.find(c => c.id === classroomAssignment.classroom_id);
      if (assignedClassroom) {
        preferredClassrooms = [assignedClassroom];
      }
    }

    // For lab subjects, check lab schedules first
    if (subject.is_lab || subject.name.toLowerCase().includes('lab')) {
      const relevantLabSchedule = labSchedules.find(schedule =>
        schedule.subject_id === subject.id &&
        schedule.day === day &&
        schedule.time_slot_id === timeSlotId &&
        (!schedule.class_id || schedule.class_id === classId)
      );

      if (relevantLabSchedule) {
        const labClassroom = classrooms.find(c => c.id === relevantLabSchedule.classroom_id);
        if (labClassroom && labClassroom.is_lab) {
          return labClassroom;
        }
      }
    }

    // Filter available classrooms
    const availableClassrooms = preferredClassrooms.filter(classroom => {
      const isOccupied = existingLessons.some(lesson => 
        lesson.day === day && 
        lesson.time_slot_id === timeSlotId && 
        lesson.classroom_id === classroom.id
      );
      
      // Check lab schedule conflicts
      const hasLabConflict = labSchedules.some(schedule =>
        schedule.classroom_id === classroom.id &&
        schedule.day === day &&
        schedule.time_slot_id === timeSlotId
      );
      
      const isCompatible = (subject.is_lab || subject.name.toLowerCase().includes('lab')) 
        ? classroom.is_lab 
        : true; // Regular subjects can use any classroom
      
      return !isOccupied && !hasLabConflict && isCompatible;
    });

    if (availableClassrooms.length === 0) {
      // Fallback to any available classroom if preferred ones are occupied
      const fallbackClassrooms = classrooms.filter(classroom => {
        const isOccupied = existingLessons.some(lesson => 
          lesson.day === day && 
          lesson.time_slot_id === timeSlotId && 
          lesson.classroom_id === classroom.id
        );
        
        const hasLabConflict = labSchedules.some(schedule =>
          schedule.classroom_id === classroom.id &&
          schedule.day === day &&
          schedule.time_slot_id === timeSlotId
        );
        
        return !isOccupied && !hasLabConflict;
      });
      
      if (fallbackClassrooms.length === 0) return null;
      return fallbackClassrooms.sort((a, b) => a.capacity - b.capacity)[0];
    }

    // Return smallest suitable classroom
    return availableClassrooms.sort((a, b) => a.capacity - b.capacity)[0];
  }

  // Find preferred time slots (adjacent to existing lessons to avoid gaps)
  findPreferredTimeSlots(
    day: number,
    classId: string,
    timeSlots: any[],
    existingLessons: any[]
  ): any[] {
    // Get existing lessons for this class on this day
    const classLessonsOnDay = existingLessons.filter(
      lesson => lesson.day === day && lesson.class_id === classId
    );

    if (classLessonsOnDay.length === 0) {
      // No existing lessons, prefer early time slots
      return timeSlots.slice().sort((a, b) => a.slot_order - b.slot_order);
    }

    // Find time slots adjacent to existing lessons
    const occupiedSlotOrders = classLessonsOnDay.map(lesson => {
      const slot = timeSlots.find(ts => ts.id === lesson.time_slot_id);
      return slot ? slot.slot_order : -1;
    }).filter(order => order !== -1);

    const adjacentSlots: any[] = [];
    const availableSlots: any[] = [];

    timeSlots.forEach(timeSlot => {
      const isOccupied = classLessonsOnDay.some(lesson => lesson.time_slot_id === timeSlot.id);
      if (isOccupied) return;

      // Check if this slot is adjacent to an occupied slot
      const isAdjacent = occupiedSlotOrders.some(occupiedOrder => 
        Math.abs(timeSlot.slot_order - occupiedOrder) === 1
      );

      if (isAdjacent) {
        adjacentSlots.push(timeSlot);
      } else {
        availableSlots.push(timeSlot);
      }
    });

    // Sort adjacent slots by order, then add other available slots
    adjacentSlots.sort((a, b) => a.slot_order - b.slot_order);
    availableSlots.sort((a, b) => a.slot_order - b.slot_order);

    return [...adjacentSlots, ...availableSlots];
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

    // Fetch all required data including new tables
    const [classesData, subjectsData, teachersData, timeSlotsData, classroomsData, assignmentsData, teacherSubjectsData, classroomAssignmentsData, labSchedulesData] = await Promise.all([
      this.supabase.from('classes').select('*'),
      this.supabase.from('subjects').select('*'),
      this.supabase.from('teachers').select('*'),
      this.supabase.from('time_slots').select('*').eq('timing_id', request.timingId).order('slot_order'),
      this.supabase.from('classrooms').select('*'),
      this.supabase.from('subject_class_assignments').select('*'),
      this.supabase.from('teacher_subject_assignments').select('*'),
      this.supabase.from('class_classroom_assignments').select('*'),
      this.supabase.from('lab_schedules').select('*')
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
    const classroomAssignments = classroomAssignmentsData.data || [];
    const labSchedules = labSchedulesData.data || [];

    console.log(`Found ${classes.length} classes, ${subjects.length} subjects, ${teachers.length} teachers, ${classrooms.length} classrooms`);
    console.log(`Classroom assignments: ${classroomAssignments.length}, Lab schedules: ${labSchedules.length}`);

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
    const workingDays = [0, 1, 2, 3, 4, 5]; // Monday to Saturday

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

      // For each subject, schedule the required periods (always 3 per week)
      for (const subject of classSubjects) {
        const periodsRequired = 3; // Fixed constraint: each subject must be taught 3 times per week
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

          // Try days in order, prioritizing consecutive time slots
          const shuffledDays = this.shuffleArray(workingDays);
          const shuffledTeachers = this.shuffleArray(eligibleTeachers);

          let lessonScheduled = false;

          for (const day of shuffledDays) {
            if (lessonScheduled) break;

            // Get preferred time slots (adjacent to existing lessons to avoid gaps)
            const preferredTimeSlots = this.findPreferredTimeSlots(day, cls.id, timeSlots, lessons);

            for (const timeSlot of preferredTimeSlots) {
              if (lessonScheduled) break;

              for (const teacher of shuffledTeachers) {
                const conflicts = await this.checkConflicts(
                  day,
                  timeSlot.id,
                  teacher.id,
                  cls.id,
                  subject.id,
                  null,
                  lessons,
                  timeSlots
                );

                if (!conflicts.teacherConflict && !conflicts.classConflict && !conflicts.backToBackConflict && !conflicts.teacherDailyLimitExceeded) {
                  // Find suitable classroom
                  const classroom = this.findSuitableClassroom(
                    subject,
                    cls.id,
                    classrooms,
                    classroomAssignments,
                    labSchedules,
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