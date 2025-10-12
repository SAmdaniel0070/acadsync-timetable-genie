import { supabase } from "@/integrations/supabase/client";
import { Timetable, Class, Teacher, Subject, TimeSlot, Lesson, Classroom, LabSchedule, Batch } from "@/types";

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

    // After generation, generate batch lab schedules
    await this.generateBatchLabSchedules();

    // After generation, fetch the updated timetable with lessons
    const updatedTimetable = await this.getTimetable();
    if (!updatedTimetable) {
      throw new Error('Failed to fetch generated timetable');
    }

    return updatedTimetable;
  },

  async updateLesson(lesson: Lesson): Promise<void> {
    const updateData: any = {
      timetable_id: lesson.timetable_id,
      class_id: lesson.classId || lesson.class_id,
      subject_id: lesson.subjectId || lesson.subject_id,
      teacher_id: lesson.teacherId || lesson.teacher_id,
      classroom_id: lesson.classroomId || lesson.classroom_id,
      time_slot_id: lesson.timeSlotId || lesson.time_slot_id,
      day: lesson.day,
      duration_slots: lesson.duration_slots || 1,
      is_continuation: lesson.is_continuation || false,
      parent_lesson_id: lesson.parent_lesson_id || null,
    };

    const { error } = await (supabase as any)
      .from('lessons')
      .update(updateData)
      .eq('id', lesson.id);

    if (error) throw error;
  },

  async deleteLesson(id: string): Promise<void> {
    // First, check if this lesson has a continuation or is a continuation
    const { data: lessonData } = await (supabase as any)
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (lessonData) {
      // If this is a parent lesson with continuation, delete the continuation too
      if (lessonData.duration_slots === 2 && !lessonData.is_continuation) {
        await (supabase as any)
          .from('lessons')
          .delete()
          .eq('parent_lesson_id', id);
      }

      // If this is a continuation lesson, also delete the parent
      if (lessonData.is_continuation && lessonData.parent_lesson_id) {
        await (supabase as any)
          .from('lessons')
          .delete()
          .eq('id', lessonData.parent_lesson_id);
      }
    }

    // Delete the main lesson
    const { error } = await (supabase as any)
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addLesson(lesson: Omit<Lesson, "id">): Promise<Lesson> {
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

    const insertData: any = {
      timetable_id: timetableId,
      class_id: lesson.classId || lesson.class_id,
      subject_id: lesson.subjectId || lesson.subject_id,
      teacher_id: lesson.teacherId || lesson.teacher_id,
      classroom_id: lesson.classroomId || lesson.classroom_id,
      time_slot_id: lesson.timeSlotId || lesson.time_slot_id,
      day: lesson.day,
      duration_slots: lesson.duration_slots || 1,
      is_continuation: lesson.is_continuation || false,
      parent_lesson_id: lesson.parent_lesson_id || null,
    };

    const { data, error } = await (supabase as any)
      .from('lessons')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Transform the returned data to include compatibility fields
    const transformedLesson = {
      ...data,
      classId: data.class_id,
      subjectId: data.subject_id,
      teacherId: data.teacher_id,
      classroomId: data.classroom_id,
      timeSlotId: data.time_slot_id,
    };

    // If this is a 2-hour lab (duration_slots = 2), create a continuation lesson
    if (data.duration_slots === 2 && !data.is_continuation) {
      // Get the next time slot
      const timeSlots = await this.getTimeSlots();
      const currentSlot = timeSlots.find(slot => slot.id === data.time_slot_id);
      const nextSlot = timeSlots.find(slot =>
        slot.slot_order === (currentSlot?.slot_order || 0) + 1 &&
        !slot.is_break
      );

      if (nextSlot) {
        const continuationData = {
          ...insertData,
          time_slot_id: nextSlot.id,
          is_continuation: true,
          parent_lesson_id: data.id,
          duration_slots: 1, // Continuation slot is always 1
        };

        await (supabase as any)
          .from('lessons')
          .insert(continuationData);
      }
    }

    return transformedLesson;
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
  },

  async getBatches(): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('batches')
        .select('*')
        .order('class_id, name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching batches:', error);
      return [];
    }
  },

  async getBatchTeacherAssignments(): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('batch_teacher_assignments')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching batch teacher assignments:', error);
      return [];
    }
  },

  async generateBatchLabSchedules(): Promise<void> {
    try {
      console.log('Starting batch lab schedule generation...');

      // Get all required data
      const [classes, subjects, teachers, batches, timeSlots, classrooms, assignments] = await Promise.all([
        this.getClasses(),
        this.getSubjects(),
        this.getTeachers(),
        this.getBatches(),
        this.getTimeSlots(),
        this.getClassrooms(),
        this.getBatchTeacherAssignments()
      ]);

      // Clear existing lab schedules
      await (supabase as any)
        .from('lab_schedules')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Filter lab subjects only
      const labSubjects = subjects.filter(subject => subject.isLab);
      const labClassrooms = classrooms.filter(classroom => classroom.isLab);
      const teachingTimeSlots = timeSlots.filter(slot => !slot.isBreak && !slot.is_break);

      console.log(`Found ${labSubjects.length} lab subjects, ${batches.length} batches, ${labClassrooms.length} lab classrooms`);

      // Group batches by class
      const batchesByClass = batches.reduce((acc: any, batch: any) => {
        if (!acc[batch.class_id]) {
          acc[batch.class_id] = [];
        }
        acc[batch.class_id].push(batch);
        return acc;
      }, {});

      // Create lab schedules for each class
      for (const classItem of classes) {
        const classBatches = batchesByClass[classItem.id] || [];
        if (classBatches.length === 0) continue;

        // Get lab subjects for this class
        const classLabSubjects = labSubjects.filter(subject =>
          subject.classes?.includes(classItem.id)
        );

        console.log(`Processing class ${classItem.name} with ${classBatches.length} batches and ${classLabSubjects.length} lab subjects`);

        for (const subject of classLabSubjects) {
          // Calculate total lab sessions needed based on periods per week
          const labSessionsPerWeek = subject.periodsPerWeek || 1;
          const labDuration = subject.lab_duration_hours || 1;

          console.log(`Subject ${subject.name}: ${labSessionsPerWeek} sessions/week, ${labDuration}h duration`);

          // For each batch, schedule the required lab sessions
          for (const batch of classBatches) {
            // Find assigned teacher for this batch and subject
            const teacherAssignment = assignments.find(assignment =>
              assignment.batch_id === batch.id &&
              assignment.subject_id === subject.id &&
              assignment.assignment_type === 'lab'
            );

            const assignedTeacher = teacherAssignment ?
              teachers.find(t => t.id === teacherAssignment.teacher_id) :
              teachers.find(t => t.subjects?.includes(subject.id)); // Fallback to any qualified teacher

            if (!assignedTeacher) {
              console.warn(`No teacher found for batch ${batch.name} - subject ${subject.name}`);
              continue;
            }

            // Schedule lab sessions for this batch
            await this.scheduleBatchLabSessions({
              batch,
              subject,
              teacher: assignedTeacher,
              classItem,
              labSessionsPerWeek,
              labDuration,
              teachingTimeSlots,
              labClassrooms,
              existingSchedules: [] // Will be populated as we create schedules
            });
          }
        }
      }

      console.log('Batch lab schedule generation completed');
    } catch (error) {
      console.error('Error generating batch lab schedules:', error);
      throw error;
    }
  },

  async scheduleBatchLabSessions(params: {
    batch: any;
    subject: any;
    teacher: any;
    classItem: any;
    labSessionsPerWeek: number;
    labDuration: number;
    teachingTimeSlots: any[];
    labClassrooms: any[];
    existingSchedules: any[];
  }): Promise<void> {
    const { batch, subject, teacher, classItem, labSessionsPerWeek, labDuration, teachingTimeSlots, labClassrooms } = params;

    // Get existing schedules to avoid conflicts
    const { data: existingSchedules } = await (supabase as any)
      .from('lab_schedules')
      .select('*');

    const schedules = existingSchedules || [];

    // Create time slots for the week (0-5 for Monday-Saturday)
    const weekDays = [0, 1, 2, 3, 4, 5];
    const availableSlots: Array<{ day: number, timeSlotId: string, timeSlot: any }> = [];

    // Build available slots
    for (const day of weekDays) {
      for (const timeSlot of teachingTimeSlots) {
        // For 2-hour labs, ensure next slot is also available
        if (labDuration === 2) {
          const nextSlot = teachingTimeSlots.find(slot =>
            slot.slot_order === timeSlot.slot_order + 1 && !slot.is_break
          );
          if (!nextSlot) continue; // Skip if no consecutive slot available
        }

        availableSlots.push({
          day,
          timeSlotId: timeSlot.id,
          timeSlot
        });
      }
    }

    // Shuffle available slots for random distribution
    const shuffledSlots = [...availableSlots].sort(() => Math.random() - 0.5);

    let scheduledSessions = 0;
    const maxAttempts = shuffledSlots.length;
    let attempts = 0;

    for (const slot of shuffledSlots) {
      if (scheduledSessions >= labSessionsPerWeek || attempts >= maxAttempts) break;
      attempts++;

      // Check for conflicts
      const hasConflict = await this.checkLabScheduleConflict({
        day: slot.day,
        timeSlotId: slot.timeSlotId,
        teacherId: teacher.id,
        batchId: batch.id,
        classId: classItem.id,
        labDuration,
        existingSchedules: schedules,
        teachingTimeSlots
      });

      if (hasConflict) continue;

      // Find available lab classroom
      const availableClassroom = await this.findAvailableLabClassroom({
        day: slot.day,
        timeSlotId: slot.timeSlotId,
        labDuration,
        labClassrooms,
        existingSchedules: schedules,
        teachingTimeSlots
      });

      if (!availableClassroom) continue;

      // Create the lab schedule
      const labScheduleData = {
        subject_id: subject.id,
        teacher_id: teacher.id,
        classroom_id: availableClassroom.id,
        time_slot_id: slot.timeSlotId,
        day: slot.day,
        class_id: classItem.id,
        batch_id: batch.id
      };

      const { data: newSchedule, error } = await (supabase as any)
        .from('lab_schedules')
        .insert(labScheduleData)
        .select()
        .single();

      if (error) {
        console.error('Error creating lab schedule:', error);
        continue;
      }

      schedules.push(newSchedule);
      scheduledSessions++;

      // For 2-hour labs, create continuation entry
      if (labDuration === 2) {
        const nextSlot = teachingTimeSlots.find(ts =>
          ts.slot_order === slot.timeSlot.slot_order + 1 && !ts.is_break
        );

        if (nextSlot) {
          const continuationData = {
            ...labScheduleData,
            time_slot_id: nextSlot.id
          };

          const { data: continuationSchedule } = await (supabase as any)
            .from('lab_schedules')
            .insert(continuationData)
            .select()
            .single();

          if (continuationSchedule) {
            schedules.push(continuationSchedule);
          }
        }
      }

      console.log(`Scheduled lab session for batch ${batch.name} - ${subject.name} on day ${slot.day} at ${slot.timeSlot.start_time}`);
    }

    if (scheduledSessions < labSessionsPerWeek) {
      console.warn(`Could only schedule ${scheduledSessions}/${labSessionsPerWeek} lab sessions for batch ${batch.name} - ${subject.name}`);
    }
  },

  /**
   * Enhanced conflict detection that checks both lab schedules and main timetable lessons
   * CRITICAL: Prevents scheduling lab sessions when class has theory/lecture sessions
   */
  async checkLabScheduleConflict(params: {
    day: number;
    timeSlotId: string;
    teacherId: string;
    batchId: string;
    classId: string;
    labDuration: number;
    existingSchedules: any[];
    teachingTimeSlots: any[];
  }): Promise<boolean> {
    const { day, timeSlotId, teacherId, batchId, classId, labDuration, existingSchedules, teachingTimeSlots } = params;

    // Get current time slot info
    const currentSlot = teachingTimeSlots.find(slot => slot.id === timeSlotId);
    if (!currentSlot) return true;

    // Check slots to verify (current + next if 2-hour lab)
    const slotsToCheck = [timeSlotId];
    if (labDuration === 2) {
      const nextSlot = teachingTimeSlots.find(slot =>
        slot.slot_order === currentSlot.slot_order + 1 && !slot.is_break
      );
      if (nextSlot) {
        slotsToCheck.push(nextSlot.id);
      } else {
        return true; // No next slot available for 2-hour lab
      }
    }

    // Get existing lessons from the main timetable to check for theory/lecture conflicts
    const { data: existingLessons } = await (supabase as any)
      .from('lessons')
      .select('*');

    const mainTimetableLessons = existingLessons || [];

    // Check for conflicts in all required slots
    for (const slotId of slotsToCheck) {
      // Check conflicts with existing lab schedules
      const labScheduleConflicts = existingSchedules.filter(schedule =>
        schedule.day === day &&
        schedule.time_slot_id === slotId && (
          schedule.teacher_id === teacherId || // Teacher conflict
          schedule.batch_id === batchId || // Batch conflict
          schedule.class_id === classId // Class conflict
        )
      );

      if (labScheduleConflicts.length > 0) {
        console.log(`Lab schedule conflict found for batch ${batchId} on day ${day} at slot ${slotId}`);
        return true; // Conflict found
      }

      // Check conflicts with main timetable lessons (theory/lectures)
      const mainTimetableConflicts = mainTimetableLessons.filter((lesson: any) =>
        lesson.day === day &&
        lesson.time_slot_id === slotId && (
          lesson.teacher_id === teacherId || // Teacher is already teaching another class
          lesson.class_id === classId // Class already has a theory/lecture session
        )
      );

      if (mainTimetableConflicts.length > 0) {
        console.log(`Main timetable conflict found for batch ${batchId} on day ${day} at slot ${slotId} - class has theory/lecture or teacher is busy`);
        return true; // Conflict with main timetable found
      }

      // Additional check: if this is a multi-hour lesson from previous slot
      if (currentSlot.slot_order > 0) {
        const previousSlot = teachingTimeSlots.find(slot =>
          slot.slot_order === currentSlot.slot_order - 1 && !slot.is_break
        );

        if (previousSlot) {
          const previousSlotConflicts = mainTimetableLessons.filter((lesson: any) =>
            lesson.day === day &&
            lesson.time_slot_id === previousSlot.id &&
            lesson.class_id === classId &&
            lesson.duration_slots === 2 // 2-hour lesson from previous slot
          );

          if (previousSlotConflicts.length > 0) {
            console.log(`Multi-hour lesson conflict found for batch ${batchId} on day ${day} at slot ${slotId} - previous slot has 2-hour lesson`);
            return true; // Conflict with 2-hour lesson from previous slot
          }
        }
      }
    }

    return false; // No conflicts
  },

  async findAvailableLabClassroom(params: {
    day: number;
    timeSlotId: string;
    labDuration: number;
    labClassrooms: any[];
    existingSchedules: any[];
    teachingTimeSlots: any[];
  }): Promise<any | null> {
    const { day, timeSlotId, labDuration, labClassrooms, existingSchedules, teachingTimeSlots } = params;

    // Get current time slot info
    const currentSlot = teachingTimeSlots.find(slot => slot.id === timeSlotId);
    if (!currentSlot) return null;

    // Get slots to check (current + next if 2-hour lab)
    const slotsToCheck = [timeSlotId];
    if (labDuration === 2) {
      const nextSlot = teachingTimeSlots.find(slot =>
        slot.slot_order === currentSlot.slot_order + 1 && !slot.is_break
      );
      if (nextSlot) {
        slotsToCheck.push(nextSlot.id);
      } else {
        return null; // No next slot available
      }
    }

    // Get existing lessons from main timetable to check classroom conflicts
    const { data: existingLessons } = await (supabase as any)
      .from('lessons')
      .select('*');

    const mainTimetableLessons = existingLessons || [];

    // Find classroom that's available in all required slots
    for (const classroom of labClassrooms) {
      let isAvailable = true;

      for (const slotId of slotsToCheck) {
        // Check conflicts with existing lab schedules
        const labScheduleOccupied = existingSchedules.some(schedule =>
          schedule.day === day &&
          schedule.time_slot_id === slotId &&
          schedule.classroom_id === classroom.id
        );

        // Check conflicts with main timetable lessons
        const mainTimetableOccupied = mainTimetableLessons.some((lesson: any) =>
          lesson.day === day &&
          lesson.time_slot_id === slotId &&
          lesson.classroom_id === classroom.id
        );

        if (labScheduleOccupied || mainTimetableOccupied) {
          isAvailable = false;
          break;
        }
      }

      if (isAvailable) {
        return classroom;
      }
    }

    return null; // No available classroom found
  },

  async regenerateBatchLabSchedules(): Promise<void> {
    try {
      console.log('Regenerating batch lab schedules...');
      await this.generateBatchLabSchedules();
      console.log('Batch lab schedules regenerated successfully');
    } catch (error) {
      console.error('Error regenerating batch lab schedules:', error);
      throw error;
    }
  },

  async clearBatchLabSchedules(): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('lab_schedules')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      console.log('All batch lab schedules cleared');
    } catch (error) {
      console.error('Error clearing batch lab schedules:', error);
      throw error;
    }
  }
};