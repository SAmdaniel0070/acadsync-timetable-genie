import { supabase } from "@/integrations/supabase/client";
import { Timetable, Class, Teacher, Subject, TimeSlot, Lesson, Classroom } from "@/types";

export const TimetableService = {
  async getTimetable(): Promise<Timetable | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('timetables')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
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
        .select('*');
      
      if (error) throw error;
      return data || [];
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
      return data || [];
    } catch {
      return [];
    }
  },

  async generateTimetable(): Promise<Timetable> {
    const { data, error } = await supabase.functions.invoke('generate-timetable');
    
    if (error) throw error;
    return data;
  },

  async updateLesson(lesson: Lesson): Promise<void> {
    const { error } = await (supabase as any)
      .from('lessons')
      .update(lesson)
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
    const { error } = await (supabase as any)
      .from('lessons')
      .insert(lesson);
    
    if (error) throw error;
  },

  async updateTimetable(timetable: Timetable): Promise<void> {
    const { error } = await (supabase as any)
      .from('timetables')
      .update(timetable)
      .eq('id', timetable.id);
    
    if (error) throw error;
  }
};