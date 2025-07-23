import { supabase } from "@/integrations/supabase/client";
import { Timetable, Class, Teacher, Subject, TimeSlot, Lesson, Classroom } from "@/types";

export const TimetableService = {
  async getTimetable(): Promise<Timetable | null> {
    try {
      const { data: timetableData, error: timetableError } = await (supabase as any)
        .from('timetables')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (timetableError) throw timetableError;
      if (!timetableData) return null;

      // Get lessons for this timetable
      const { data: lessonsData, error: lessonsError } = await (supabase as any)
        .from('lessons')
        .select('*')
        .eq('timetable_id', timetableData.id);
      
      if (lessonsError) throw lessonsError;

      // Transform lessons to include compatibility fields
      const transformedLessons = (lessonsData || []).map((lesson: any) => ({
        ...lesson,
        classId: lesson.class_id,
        subjectId: lesson.subject_id,
        teacherId: lesson.teacher_id,
        classroomId: lesson.classroom_id,
        timeSlotId: lesson.time_slot_id,
      }));

      return {
        ...timetableData,
        lessons: transformedLessons,
      };
    } catch {
      return null;
    }
  },

  async getClasses(): Promise<Class[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('classes')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async getTeachers(): Promise<Teacher[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('teachers')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async getSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('subjects')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async getTimeSlots(): Promise<TimeSlot[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('time_slots')
        .select('*')
        .order('slot_order');
      
      if (error) throw error;
      
      // Transform to include compatibility fields
      const transformedData = (data || []).map((slot: any) => ({
        ...slot,
        startTime: slot.start_time,
        endTime: slot.end_time,
        isBreak: slot.is_break,
        name: `${slot.start_time} - ${slot.end_time}`,
      }));
      
      return transformedData;
    } catch {
      return [];
    }
  },

  async getClassrooms(): Promise<Classroom[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('classrooms')
        .select('*');
      
      if (error) throw error;
      
      // Transform to include compatibility fields
      const transformedData = (data || []).map((classroom: any) => ({
        ...classroom,
        isLab: classroom.is_lab,
      }));
      
      return transformedData;
    } catch {
      return [];
    }
  },

  async generateTimetable(): Promise<Timetable> {
    // Get the first timing for default parameters
    const { data: timingData } = await (supabase as any)
      .from('timings')
      .select('id')
      .limit(1)
      .single();

    if (!timingData) {
      throw new Error('No timing configuration found. Please create timing slots first.');
    }

    // Check if we have the required data
    const [classes, subjects, teachers] = await Promise.all([
      this.getClasses(),
      this.getSubjects(), 
      this.getTeachers()
    ]);

    if (classes.length === 0) {
      throw new Error('No classes found. Please add classes first.');
    }
    if (subjects.length === 0) {
      throw new Error('No subjects found. Please add subjects first.');
    }
    if (teachers.length === 0) {
      throw new Error('No teachers found. Please add teachers first.');
    }

    const { data, error } = await supabase.functions.invoke('generate-timetable', {
      body: {
        name: `Generated Timetable ${new Date().toLocaleDateString()}`,
        academicYear: new Date().getFullYear().toString(),
        timingId: timingData.id
      }
    });
    
    if (error) throw error;
    return data;
  },

  async updateLesson(lesson: Lesson): Promise<void> {
    const { error } = await (supabase as any)
      .from('lessons')
      .update({
        class_id: lesson.classId || lesson.class_id,
        subject_id: lesson.subjectId || lesson.subject_id,
        teacher_id: lesson.teacherId || lesson.teacher_id,
        classroom_id: lesson.classroomId || lesson.classroom_id,
        time_slot_id: lesson.timeSlotId || lesson.time_slot_id,
        day: lesson.day,
      })
      .eq('id', lesson.id);
    
    if (error) throw error;
  },

  async deleteLesson(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('lessons')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async addLesson(lesson: Omit<Lesson, "id">): Promise<void> {
    // Get the first timetable if timetable_id is not provided
    let timetableId = lesson.timetable_id;
    if (!timetableId) {
      const { data: timetableData } = await (supabase as any)
        .from('timetables')
        .select('id')
        .limit(1)
        .single();
      timetableId = timetableData?.id;
    }

    const { error } = await (supabase as any)
      .from('lessons')
      .insert({
        timetable_id: timetableId,
        class_id: lesson.classId || lesson.class_id,
        subject_id: lesson.subjectId || lesson.subject_id,
        teacher_id: lesson.teacherId || lesson.teacher_id,
        classroom_id: lesson.classroomId || lesson.classroom_id,
        time_slot_id: lesson.timeSlotId || lesson.time_slot_id,
        day: lesson.day,
      });
    
    if (error) throw error;
  },

  async updateTimetable(timetable: Timetable): Promise<void> {
    const { error } = await (supabase as any)
      .from('timetables')
      .update({
        name: timetable.name,
        timing_id: timetable.timing_id,
      })
      .eq('id', timetable.id);
    
    if (error) throw error;
  }
};