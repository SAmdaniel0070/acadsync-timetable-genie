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
    const startTime = Date.now();
    console.log('🚀 Starting optimized timetable generation...');

    try {
      // Get timing configuration with error handling
      const { data: timingData, error: timingError } = await (supabase as any)
        .from('timings')
        .select('id')
        .limit(1)
        .single();

      if (timingError || !timingData) {
        throw new Error('No timing configuration found. Please create timing slots first.');
      }

      // Validate required data in parallel with detailed error messages
      const [classesResult, subjectsResult, teachersResult] = await Promise.allSettled([
        this.getClasses(),
        this.getSubjects(),
        this.getTeachers()
      ]);

      const classes = classesResult.status === 'fulfilled' ? classesResult.value : [];
      const subjects = subjectsResult.status === 'fulfilled' ? subjectsResult.value : [];
      const teachers = teachersResult.status === 'fulfilled' ? teachersResult.value : [];

      // Detailed validation with helpful error messages
      const validationErrors: string[] = [];

      if (classes.length === 0) {
        validationErrors.push('No classes found. Please add classes in the Classes section.');
      }
      if (subjects.length === 0) {
        validationErrors.push('No subjects found. Please add subjects in the Subjects section.');
      }
      if (teachers.length === 0) {
        validationErrors.push('No teachers found. Please add teachers in the Teachers section.');
      }

      // Check for subject-class assignments
      const subjectsWithClasses = subjects.filter((s: any) => s.classes && s.classes.length > 0);
      if (subjectsWithClasses.length === 0) {
        validationErrors.push('No subject-class assignments found. Please assign subjects to classes.');
      }

      // Check for teacher-subject assignments
      const teachersWithSubjects = teachers.filter((t: any) => t.subjects && t.subjects.length > 0);
      if (teachersWithSubjects.length === 0) {
        validationErrors.push('No teacher-subject assignments found. Please assign subjects to teachers.');
      }

      if (validationErrors.length > 0) {
        throw new Error(`Timetable generation failed:\n${validationErrors.join('\n')}`);
      }

      console.log(`📊 Validation passed: ${classes.length} classes, ${subjects.length} subjects, ${teachers.length} teachers`);

      // Generate main timetable with timeout and retry logic
      let timetableData;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          console.log(`🎯 Generating main timetable (attempt ${attempts + 1}/${maxAttempts})...`);

          const result = await Promise.race([
            supabase.functions.invoke('generate-timetable', {
              body: {
                name: `Generated Timetable ${new Date().toLocaleDateString()}`,
                academicYear: new Date().getFullYear().toString(),
                timingId: timingData.id
              }
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timetable generation timeout')), 30000)
            )
          ]) as any;

          const { data, error } = result;

          if (error) {
            throw error;
          }

          timetableData = data;
          break;
        } catch (error) {
          attempts++;
          console.warn(`⚠️ Timetable generation attempt ${attempts} failed:`, error);

          if (attempts >= maxAttempts) {
            throw new Error(`Failed to generate timetable after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      console.log('✅ Main timetable generated successfully');

      // Generate batch lab schedules with error isolation
      try {
        console.log('🧪 Generating batch lab schedules...');
        await this.generateBatchLabSchedules();
        console.log('✅ Batch lab schedules generated successfully');
      } catch (labError) {
        console.warn('⚠️ Batch lab generation failed, continuing with main timetable:', labError);
        // Don't fail the entire generation if lab scheduling fails
      }

      // Fetch the final timetable with retry logic
      let updatedTimetable;
      attempts = 0;

      while (attempts < 3) {
        try {
          updatedTimetable = await this.getTimetable();
          if (updatedTimetable) break;
        } catch (error) {
          console.warn(`⚠️ Failed to fetch timetable (attempt ${attempts + 1}):`, error);
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!updatedTimetable) {
        throw new Error('Failed to fetch generated timetable after multiple attempts');
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 Timetable generation completed successfully in ${duration}ms`);

      return updatedTimetable;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Timetable generation failed after ${duration}ms:`, error);

      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Timetable generation is taking too long. Please try again or contact support if the issue persists.');
        }
        if (error.message.includes('No timing configuration')) {
          throw new Error('Please configure timing slots in the Settings section before generating a timetable.');
        }
        throw error;
      }

      throw new Error('An unexpected error occurred during timetable generation. Please try again.');
    }
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
    // Simplified deletion - no need to handle continuation slots
    // since we now use single entries with duration_slots
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

    // Note: 2-hour labs are now handled as single entries with duration_slots = 2
    // No need to create separate continuation entries

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
    const startTime = Date.now();
    try {
      console.log('🚀 Starting optimized batch lab schedule generation...');

      // Get all required data in parallel with error handling
      const [classes, subjects, teachers, batches, timeSlots, classrooms, assignments, existingLessons, existingLabSchedules] = await Promise.allSettled([
        this.getClasses(),
        this.getSubjects(),
        this.getTeachers(),
        this.getBatches(),
        this.getTimeSlots(),
        this.getClassrooms(),
        this.getBatchTeacherAssignments(),
        this.getAllLessons(), // Get all lessons at once
        this.getAllLabSchedules() // Get all lab schedules at once
      ]).then(results => results.map(result => result.status === 'fulfilled' ? result.value : []));

      // Clear existing lab schedules in batch
      await this.clearAllLabSchedules();

      // Pre-filter and organize data
      const labSubjects = subjects.filter((subject: any) => subject.isLab);
      const labClassrooms = classrooms.filter((classroom: any) => classroom.isLab);
      const teachingTimeSlots = timeSlots.filter((slot: any) => !slot.isBreak && !slot.is_break);

      if (labSubjects.length === 0) {
        console.log('⚠️ No lab subjects found, skipping batch lab generation');
        return;
      }

      console.log(`📊 Data loaded: ${labSubjects.length} lab subjects, ${batches.length} batches, ${labClassrooms.length} lab classrooms`);

      // Create optimized data structures for fast lookups
      const batchesByClass = this.groupBatchesByClass(batches);
      const teachersBySubject = this.createTeacherSubjectMap(teachers, assignments);
      const conflictChecker = new OptimizedConflictChecker(existingLessons, existingLabSchedules, teachingTimeSlots);

      // Generate all lab schedules in batches
      const allLabSchedulesToCreate: any[] = [];

      for (const classItem of classes) {
        const classBatches = batchesByClass[classItem.id] || [];
        if (classBatches.length === 0) continue;

        const classLabSubjects = labSubjects.filter((subject: any) =>
          subject.classes?.includes(classItem.id)
        );

        console.log(`🎯 Processing class ${classItem.name}: ${classBatches.length} batches, ${classLabSubjects.length} lab subjects`);

        for (const subject of classLabSubjects) {
          const labSessionsPerWeek = subject.periodsPerWeek || 1;
          const labDuration = subject.lab_duration_hours || 1;

          for (const batch of classBatches) {
            const assignedTeacher = teachersBySubject[`${batch.id}-${subject.id}`] ||
              teachers.find((t: any) => t.subjects?.includes(subject.id));

            if (!assignedTeacher) {
              console.warn(`⚠️ No teacher found for batch ${batch.name} - subject ${subject.name}`);
              continue;
            }

            // Generate schedules for this batch efficiently
            const batchSchedules = this.generateOptimizedBatchSchedules({
              batch,
              subject,
              teacher: assignedTeacher,
              classItem,
              labSessionsPerWeek,
              labDuration,
              teachingTimeSlots,
              labClassrooms,
              conflictChecker
            });

            allLabSchedulesToCreate.push(...batchSchedules);
          }
        }
      }

      // Batch insert all schedules at once
      if (allLabSchedulesToCreate.length > 0) {
        console.log(`💾 Inserting ${allLabSchedulesToCreate.length} lab schedules in batch...`);
        await this.batchInsertLabSchedules(allLabSchedulesToCreate);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Batch lab schedule generation completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error generating batch lab schedules after ${duration}ms:`, error);
      throw new Error(`Failed to generate batch lab schedules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Legacy function - kept for backward compatibility but optimized
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
    console.warn('⚠️ Using legacy scheduleBatchLabSessions - consider using optimized batch generation');

    const { batch, subject, teacher, classItem, labSessionsPerWeek, labDuration, teachingTimeSlots, labClassrooms } = params;

    try {
      // Use optimized conflict checker
      const [existingLessons, existingSchedules] = await Promise.all([
        this.getAllLessons(),
        this.getAllLabSchedules()
      ]);

      const conflictChecker = new OptimizedConflictChecker(existingLessons, existingSchedules, teachingTimeSlots);

      const schedules = this.generateOptimizedBatchSchedules({
        batch,
        subject,
        teacher,
        classItem,
        labSessionsPerWeek,
        labDuration,
        teachingTimeSlots,
        labClassrooms,
        conflictChecker
      });

      if (schedules.length > 0) {
        await this.batchInsertLabSchedules(schedules);
        console.log(`✅ Scheduled ${schedules.length} lab sessions for batch ${batch.name} - ${subject.name}`);
      } else {
        console.warn(`⚠️ Could not schedule any lab sessions for batch ${batch.name} - ${subject.name}`);
      }
    } catch (error) {
      console.error(`❌ Error scheduling lab sessions for batch ${batch.name}:`, error);
      throw error;
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
  },

  // Optimized helper functions for faster generation
  async getAllLessons(): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('lessons')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all lessons:', error);
      return [];
    }
  },

  async getAllLabSchedules(): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('lab_schedules')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all lab schedules:', error);
      return [];
    }
  },

  async clearAllLabSchedules(): Promise<void> {
    const { error } = await (supabase as any)
      .from('lab_schedules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
  },

  groupBatchesByClass(batches: any[]): Record<string, any[]> {
    return batches.reduce((acc: any, batch: any) => {
      if (!acc[batch.class_id]) {
        acc[batch.class_id] = [];
      }
      acc[batch.class_id].push(batch);
      return acc;
    }, {});
  },

  createTeacherSubjectMap(teachers: any[], assignments: any[]): Record<string, any> {
    const map: Record<string, any> = {};

    assignments.forEach((assignment: any) => {
      if (assignment.assignment_type === 'lab') {
        const key = `${assignment.batch_id}-${assignment.subject_id}`;
        const teacher = teachers.find((t: any) => t.id === assignment.teacher_id);
        if (teacher) {
          map[key] = teacher;
        }
      }
    });

    return map;
  },

  generateOptimizedBatchSchedules(params: {
    batch: any;
    subject: any;
    teacher: any;
    classItem: any;
    labSessionsPerWeek: number;
    labDuration: number;
    teachingTimeSlots: any[];
    labClassrooms: any[];
    conflictChecker: any;
  }): any[] {
    const { batch, subject, teacher, classItem, labSessionsPerWeek, labDuration, teachingTimeSlots, labClassrooms, conflictChecker } = params;

    const schedules: any[] = [];
    const weekDays = [0, 1, 2, 3, 4, 5];

    // Create all possible slots
    const availableSlots: Array<{ day: number, timeSlotId: string, timeSlot: any }> = [];

    for (const day of weekDays) {
      for (const timeSlot of teachingTimeSlots) {
        // For 2-hour labs, ensure next slot is available
        if (labDuration === 2) {
          const nextSlot = teachingTimeSlots.find((slot: any) =>
            slot.slot_order === timeSlot.slot_order + 1 && !slot.is_break
          );
          if (!nextSlot) continue;
        }

        availableSlots.push({ day, timeSlotId: timeSlot.id, timeSlot });
      }
    }

    // Shuffle for random distribution
    const shuffledSlots = [...availableSlots].sort(() => Math.random() - 0.5);

    let scheduledSessions = 0;

    for (const slot of shuffledSlots) {
      if (scheduledSessions >= labSessionsPerWeek) break;

      // Fast conflict check
      if (conflictChecker.hasConflict(slot.day, slot.timeSlotId, teacher.id, batch.id, classItem.id, labDuration)) {
        continue;
      }

      // Find available classroom
      const availableClassroom = this.findAvailableClassroomFast(
        slot.day, slot.timeSlotId, labDuration, labClassrooms, conflictChecker
      );

      if (!availableClassroom) continue;

      // Create schedule data with duration information
      const scheduleData = {
        subject_id: subject.id,
        teacher_id: teacher.id,
        classroom_id: availableClassroom.id,
        time_slot_id: slot.timeSlotId,
        day: slot.day,
        class_id: classItem.id,
        batch_id: batch.id,
        duration_slots: labDuration // Store the duration for proper rendering
      };

      schedules.push(scheduleData);

      // Add to conflict checker for future checks
      conflictChecker.addSchedule(scheduleData);

      // Note: 2-hour labs are handled as single entries with duration_slots = 2
      // The UI will render them spanning multiple time slots based on duration_slots
      // No need to create separate continuation entries

      scheduledSessions++;
    }

    return schedules;
  },

  findAvailableClassroomFast(day: number, timeSlotId: string, labDuration: number, labClassrooms: any[], conflictChecker: any): any | null {
    for (const classroom of labClassrooms) {
      if (!conflictChecker.hasClassroomConflict(day, timeSlotId, classroom.id, labDuration)) {
        return classroom;
      }
    }
    return null;
  },

  async batchInsertLabSchedules(schedules: any[]): Promise<void> {
    const BATCH_SIZE = 100; // Insert in batches of 100

    for (let i = 0; i < schedules.length; i += BATCH_SIZE) {
      const batch = schedules.slice(i, i + BATCH_SIZE);

      const { error } = await (supabase as any)
        .from('lab_schedules')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
        throw error;
      }
    }
  }
};

// Optimized conflict checker class
class OptimizedConflictChecker {
  private lessonConflicts: Set<string> = new Set();
  private labConflicts: Set<string> = new Set();
  private classroomConflicts: Set<string> = new Set();
  private teachingTimeSlots: any[];

  constructor(lessons: any[], labSchedules: any[], teachingTimeSlots: any[]) {
    this.teachingTimeSlots = teachingTimeSlots;

    // Pre-compute conflict keys for fast lookup
    lessons.forEach((lesson: any) => {
      const key = `${lesson.day}-${lesson.time_slot_id}`;
      this.lessonConflicts.add(`${key}-teacher-${lesson.teacher_id}`);
      this.lessonConflicts.add(`${key}-class-${lesson.class_id}`);
      if (lesson.classroom_id) {
        this.classroomConflicts.add(`${key}-${lesson.classroom_id}`);
      }

      // Handle 2-hour lessons
      if (lesson.duration_slots === 2) {
        const nextSlot = this.findNextSlot(lesson.time_slot_id);
        if (nextSlot) {
          const nextKey = `${lesson.day}-${nextSlot.id}`;
          this.lessonConflicts.add(`${nextKey}-teacher-${lesson.teacher_id}`);
          this.lessonConflicts.add(`${nextKey}-class-${lesson.class_id}`);
          if (lesson.classroom_id) {
            this.classroomConflicts.add(`${nextKey}-${lesson.classroom_id}`);
          }
        }
      }
    });

    labSchedules.forEach((schedule: any) => {
      const key = `${schedule.day}-${schedule.time_slot_id}`;
      this.labConflicts.add(`${key}-teacher-${schedule.teacher_id}`);
      this.labConflicts.add(`${key}-batch-${schedule.batch_id}`);
      this.labConflicts.add(`${key}-class-${schedule.class_id}`);
      this.classroomConflicts.add(`${key}-${schedule.classroom_id}`);
    });
  }

  hasConflict(day: number, timeSlotId: string, teacherId: string, batchId: string, classId: string, labDuration: number): boolean {
    const slotsToCheck = [timeSlotId];

    if (labDuration === 2) {
      const nextSlot = this.findNextSlot(timeSlotId);
      if (!nextSlot) return true;
      slotsToCheck.push(nextSlot.id);
    }

    for (const slotId of slotsToCheck) {
      const key = `${day}-${slotId}`;

      if (this.lessonConflicts.has(`${key}-teacher-${teacherId}`) ||
        this.lessonConflicts.has(`${key}-class-${classId}`) ||
        this.labConflicts.has(`${key}-teacher-${teacherId}`) ||
        this.labConflicts.has(`${key}-batch-${batchId}`) ||
        this.labConflicts.has(`${key}-class-${classId}`)) {
        return true;
      }
    }

    return false;
  }

  hasClassroomConflict(day: number, timeSlotId: string, classroomId: string, labDuration: number): boolean {
    const slotsToCheck = [timeSlotId];

    if (labDuration === 2) {
      const nextSlot = this.findNextSlot(timeSlotId);
      if (!nextSlot) return true;
      slotsToCheck.push(nextSlot.id);
    }

    for (const slotId of slotsToCheck) {
      const key = `${day}-${slotId}-${classroomId}`;
      if (this.classroomConflicts.has(key)) {
        return true;
      }
    }

    return false;
  }

  addSchedule(schedule: any): void {
    const slotsToBlock = [schedule.time_slot_id];
    
    // For multi-hour schedules, block consecutive slots
    if (schedule.duration_slots === 2) {
      const nextSlot = this.findNextSlot(schedule.time_slot_id);
      if (nextSlot) {
        slotsToBlock.push(nextSlot.id);
      }
    }
    
    // Block all required slots
    slotsToBlock.forEach(slotId => {
      const key = `${schedule.day}-${slotId}`;
      this.labConflicts.add(`${key}-teacher-${schedule.teacher_id}`);
      this.labConflicts.add(`${key}-batch-${schedule.batch_id}`);
      this.labConflicts.add(`${key}-class-${schedule.class_id}`);
      this.classroomConflicts.add(`${key}-${schedule.classroom_id}`);
    });
  }

  private findNextSlot(timeSlotId: string): any | null {
    const currentSlot = this.teachingTimeSlots.find((slot: any) => slot.id === timeSlotId);
    if (!currentSlot) return null;

    return this.teachingTimeSlots.find((slot: any) =>
      slot.slot_order === currentSlot.slot_order + 1 && !slot.is_break
    ) || null;
  }
}