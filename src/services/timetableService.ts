import { supabase } from "@/integrations/supabase/client";
import { Timetable, Class, Teacher, Subject, TimeSlot, Lesson, Classroom } from "@/types";

export const TimetableService = {
  async getTimetable(): Promise<Timetable | null> {
    try {
      // Get the latest timetable with lessons
      const { data: timetableData, error: timetableError } = await (supabase as any)
        .from('timetables')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (timetableError) throw timetableError;
      if (!timetableData) return null;

      console.log('Fetched timetable:', timetableData);

      // Get lessons for this timetable
      const { data: lessonsData, error: lessonsError } = await (supabase as any)
        .from('lessons')
        .select('*')
        .eq('timetable_id', timetableData.id)
        .order('day, time_slot_id');
      
      if (lessonsError) throw lessonsError;

      // Transform lessons to include compatibility fields
      const transformedLessons = (lessonsData || []).map((lesson: any) => ({
        ...lesson,
        classId: lesson.class_id || lesson.classId,
        subjectId: lesson.subject_id || lesson.subjectId,
        teacherId: lesson.teacher_id || lesson.teacherId,
        classroomId: lesson.classroom_id || lesson.classroomId,
        timeSlotId: lesson.time_slot_id || lesson.timeSlotId,
      }));

      console.log('Fetched timetable lessons:', transformedLessons);

      const finalTimetable = {
        ...timetableData,
        lessons: transformedLessons,
      };

      console.log('Final timetable object:', finalTimetable);
      return finalTimetable;
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
      // First get all subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError);
        return [];
      }

      // Then get all subject-class assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subject_class_assignments')
        .select('subject_id, class_id');

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        return [];
      }

      console.log('Subjects data:', subjectsData);
      console.log('Assignments data:', assignmentsData);

      // Combine the data
      const transformedData = (subjectsData || []).map((subject: any) => {
        const subjectAssignments = (assignmentsData || []).filter(
          (assignment: any) => assignment.subject_id === subject.id
        );
        
        return {
          ...subject,
          classes: subjectAssignments.map((assignment: any) => assignment.class_id),
          periodsPerWeek: subject.periods_per_week || 1, // Use the database field
          isLab: subject.is_lab || false
        };
      });

      console.log('Final transformed subjects:', transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('Error in getSubjects:', error);
      return [];
    }
  },

  async getTimeSlots(): Promise<TimeSlot[]> {
    try {
      // Get the latest timetable's timing_id to fetch related time slots
      const { data: timetableData } = await (supabase as any)
        .from('timetables')
        .select('timing_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let query = (supabase as any).from('time_slots').select('*').order('slot_order');
      
      // If we have a timetable, filter by its timing_id
      if (timetableData?.timing_id) {
        query = query.eq('timing_id', timetableData.timing_id);
        console.log('Filtering time slots by timing_id:', timetableData.timing_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform to include compatibility fields
      const transformedData = (data || []).map((slot: any) => ({
        ...slot,
        startTime: slot.start_time,
        endTime: slot.end_time,
        isBreak: slot.is_break,
        name: `${slot.start_time} - ${slot.end_time}`,
      }));
      
      console.log('Fetched time slots:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching time slots:', error);
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
    
    // After generation, fetch the updated timetable with lessons
    const updatedTimetable = await this.getTimetable();
    if (!updatedTimetable) {
      throw new Error('Failed to fetch generated timetable');
    }
    
    return updatedTimetable;
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
  },

  async downloadTimetable(timetableId: string, format: 'csv' | 'json' | 'html' | 'pdf' | 'excel' = 'csv'): Promise<Blob> {
    try {
      // Use the hardcoded project URL pattern for Supabase
      const projectUrl = 'https://zefputjjkytoacjdmijy.supabase.co';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplZnB1dGpqa3l0b2FjamRtaWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MDY4NDQsImV4cCI6MjA2ODQ4Mjg0NH0.MQpqCAxzfakJuEH_VACgwyYGurLF--LVT9B9hep1QhM';
      
      const response = await fetch(`${projectUrl}/functions/v1/download-timetable?id=${timetableId}&format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Error downloading timetable:', error);
      throw error;
    }
  },

  async shareTimetable(shareToken: string, format: 'whatsapp' | 'email' = 'whatsapp'): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('share-timetable', {
        body: { shareToken, format }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sharing timetable:', error);
      throw error;
    }
  },

  async generateShareToken(timetableId: string): Promise<string> {
    try {
      // Generate a unique share token
      const shareToken = crypto.randomUUID();
      
      // Update the timetable with the share token using any cast for now
      const { error } = await (supabase as any)
        .from('timetables')
        .update({ share_token: shareToken })
        .eq('id', timetableId);

      if (error) throw error;
      return shareToken;
    } catch (error) {
      console.error('Error generating share token:', error);
      throw error;
    }
  }
};