import { supabase } from '@/integrations/supabase/client';

export class SupabaseService {
  // Classes
  static async getClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select('*, years(name)')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async createClass(classData: any) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateClass(id: string, classData: any) {
    const { data, error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteClass(id: string) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Teachers
  static async getTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        teacher_subject_assignments (
          subjects (id, name, code)
        )
      `)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async createTeacher(teacherData: any) {
    const { data, error } = await supabase
      .from('teachers')
      .insert(teacherData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateTeacher(id: string, teacherData: any) {
    const { data, error } = await supabase
      .from('teachers')
      .update(teacherData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteTeacher(id: string) {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Subjects
  static async getSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        subject_class_assignments (
          classes (id, name)
        ),
        teacher_subject_assignments (
          teachers (id, name)
        )
      `)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async createSubject(subjectData: any) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateSubject(id: string, subjectData: any) {
    const { data, error } = await supabase
      .from('subjects')
      .update(subjectData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteSubject(id: string) {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Classrooms
  static async getClassrooms() {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async createClassroom(classroomData: any) {
    const { data, error } = await supabase
      .from('classrooms')
      .insert(classroomData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateClassroom(id: string, classroomData: any) {
    const { data, error } = await supabase
      .from('classrooms')
      .update(classroomData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteClassroom(id: string) {
    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Years
  static async getYears() {
    const { data, error } = await supabase
      .from('years')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // Timings
  static async getTimings() {
    const { data, error } = await supabase
      .from('timings')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // Time Slots
  static async getTimeSlots() {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('slot_order');
    
    if (error) throw error;
    return data || [];
  }

  // Timetables
  static async getTimetables() {
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getTimetable(id: string) {
    const { data, error } = await supabase
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
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getActiveTimetable() {
    const { data, error } = await supabase
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
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async generateTimetable(timetableData: any) {
    const { data, error } = await supabase.functions.invoke('generate-timetable', {
      body: timetableData
    });
    
    if (error) throw error;
    return data;
  }

  static async setActiveTimetable(id: string) {
    // First, deactivate all timetables
    await supabase
      .from('timetables')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Then activate the selected one
    const { data, error } = await supabase
      .from('timetables')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateTimetable(id: string, timetableData: any) {
    const { data, error } = await supabase
      .from('timetables')
      .update(timetableData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteTimetable(id: string) {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Lessons
  static async addLesson(lessonData: any) {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateLesson(id: string, lessonData: any) {
    const { data, error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteLesson(id: string) {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Share functionality
  static async shareTimetable(shareToken: string, format: string = 'json') {
    const { data, error } = await supabase.functions.invoke('share-timetable', {
      body: {},
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      method: 'GET',
      params: { token: shareToken, format }
    });
    
    if (error) throw error;
    return data;
  }

  // Download functionality
  static async downloadTimetable(timetableId: string, format: string = 'csv') {
    const { data, error } = await supabase.functions.invoke('download-timetable', {
      body: {},
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      method: 'GET', 
      params: { id: timetableId, format }
    });
    
    if (error) throw error;
    return data;
  }

  // Assignments
  static async assignSubjectToClass(subjectId: string, classId: string) {
    const { data, error } = await supabase
      .from('subject_class_assignments')
      .insert({ subject_id: subjectId, class_id: classId })
      .select()
      .single();
    
    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
    return data;
  }

  static async assignSubjectToTeacher(subjectId: string, teacherId: string) {
    const { data, error } = await supabase
      .from('teacher_subject_assignments')
      .insert({ subject_id: subjectId, teacher_id: teacherId })
      .select()
      .single();
    
    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
    return data;
  }

  static async removeSubjectFromClass(subjectId: string, classId: string) {
    const { error } = await supabase
      .from('subject_class_assignments')
      .delete()
      .eq('subject_id', subjectId)
      .eq('class_id', classId);
    
    if (error) throw error;
  }

  static async removeSubjectFromTeacher(subjectId: string, teacherId: string) {
    const { error } = await supabase
      .from('teacher_subject_assignments')
      .delete()
      .eq('subject_id', subjectId)
      .eq('teacher_id', teacherId);
    
    if (error) throw error;
  }
}