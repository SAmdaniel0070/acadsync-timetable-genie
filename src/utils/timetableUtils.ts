import { Lesson, Subject, TimeSlot } from "@/types";

/**
 * Utility functions for handling timetable operations, especially multi-slot lessons
 */

/**
 * Check if a subject is a 2-hour lab
 */
export const isMultiHourLab = (subject: Subject): boolean => {
  return subject.isLab === true && subject.lab_duration_hours === 2;
};

/**
 * Check if a lesson is a 2-hour lab session
 */
export const isLessonMultiHour = (lesson: Lesson, subjects: Subject[]): boolean => {
  const subject = subjects.find(s => s.id === (lesson.subjectId || lesson.subject_id));
  return subject ? isMultiHourLab(subject) : false;
};

/**
 * Find the next consecutive time slot
 */
export const findNextTimeSlot = (currentSlotId: string, timeSlots: TimeSlot[]): TimeSlot | null => {
  const currentSlot = timeSlots.find(slot => slot.id === currentSlotId);
  if (!currentSlot) return null;
  
  const currentOrder = currentSlot.slot_order;
  return timeSlots.find(slot => 
    slot.slot_order === currentOrder + 1 && 
    !slot.is_break && 
    !slot.isBreak
  ) || null;
};

/**
 * Check if a time slot is occupied by a previous multi-hour lesson
 */
export const isSlotOccupiedByPreviousLesson = (
  day: number,
  timeSlotId: string,
  lessons: Lesson[],
  subjects: Subject[],
  timeSlots: TimeSlot[],
  filters?: {
    classId?: string;
    teacherId?: string;
    classroomId?: string;
  }
): Lesson | null => {
  const currentSlot = timeSlots.find(slot => slot.id === timeSlotId);
  if (!currentSlot || currentSlot.slot_order === 0) return null;
  
  const previousSlot = timeSlots.find(slot => 
    slot.slot_order === currentSlot.slot_order - 1 && 
    !slot.is_break && 
    !slot.isBreak
  );
  if (!previousSlot) return null;
  
  const previousLesson = lessons.find(lesson => {
    const matchesSlot = lesson.day === day && 
                       (lesson.timeSlotId === previousSlot.id || lesson.time_slot_id === previousSlot.id);
    
    if (!matchesSlot) return false;
    
    // Apply filters if provided
    if (filters?.classId && (lesson.classId !== filters.classId && lesson.class_id !== filters.classId)) {
      return false;
    }
    if (filters?.teacherId && (lesson.teacherId !== filters.teacherId && lesson.teacher_id !== filters.teacherId)) {
      return false;
    }
    if (filters?.classroomId && (lesson.classroomId !== filters.classroomId && lesson.classroom_id !== filters.classroomId)) {
      return false;
    }
    
    return true;
  });
  
  if (!previousLesson) return null;
  
  // Check if the previous lesson is a 2-hour lab
  return isLessonMultiHour(previousLesson, subjects) ? previousLesson : null;
};

/**
 * Get all lessons that are part of a multi-hour session (parent + continuation)
 */
export const getMultiHourLessonGroup = (
  lesson: Lesson,
  lessons: Lesson[],
  subjects: Subject[]
): Lesson[] => {
  if (!isLessonMultiHour(lesson, subjects)) {
    return [lesson];
  }
  
  // If this is a continuation lesson, find the parent
  if (lesson.is_continuation && lesson.parent_lesson_id) {
    const parentLesson = lessons.find(l => l.id === lesson.parent_lesson_id);
    if (parentLesson) {
      return [parentLesson, lesson];
    }
  }
  
  // If this is a parent lesson, find the continuation
  const continuationLesson = lessons.find(l => 
    l.parent_lesson_id === lesson.id && l.is_continuation
  );
  
  return continuationLesson ? [lesson, continuationLesson] : [lesson];
};

/**
 * Validate if a 2-hour lab can be scheduled at a specific time
 */
export const canScheduleMultiHourLab = (
  day: number,
  timeSlotId: string,
  classId: string,
  teacherId: string,
  classroomId: string | undefined,
  lessons: Lesson[],
  timeSlots: TimeSlot[]
): { canSchedule: boolean; reason?: string } => {
  const nextSlot = findNextTimeSlot(timeSlotId, timeSlots);
  
  if (!nextSlot) {
    return {
      canSchedule: false,
      reason: "No consecutive time slot available for 2-hour lab"
    };
  }
  
  // Check if either slot is already occupied
  const currentSlotConflict = lessons.some(lesson =>
    lesson.day === day &&
    (lesson.timeSlotId === timeSlotId || lesson.time_slot_id === timeSlotId) &&
    ((lesson.classId === classId || lesson.class_id === classId) ||
     (lesson.teacherId === teacherId || lesson.teacher_id === teacherId) ||
     (classroomId && (lesson.classroomId === classroomId || lesson.classroom_id === classroomId)))
  );
  
  const nextSlotConflict = lessons.some(lesson =>
    lesson.day === day &&
    (lesson.timeSlotId === nextSlot.id || lesson.time_slot_id === nextSlot.id) &&
    ((lesson.classId === classId || lesson.class_id === classId) ||
     (lesson.teacherId === teacherId || lesson.teacher_id === teacherId) ||
     (classroomId && (lesson.classroomId === classroomId || lesson.classroom_id === classroomId)))
  );
  
  if (currentSlotConflict) {
    return {
      canSchedule: false,
      reason: "Current time slot is already occupied"
    };
  }
  
  if (nextSlotConflict) {
    return {
      canSchedule: false,
      reason: "Next consecutive time slot is already occupied"
    };
  }
  
  return { canSchedule: true };
};

/**
 * Format lesson duration for display
 */
export const formatLessonDuration = (lesson: Lesson, subjects: Subject[]): string => {
  const subject = subjects.find(s => s.id === (lesson.subjectId || lesson.subject_id));
  
  if (!subject) return "";
  
  if (subject.isLab) {
    const duration = subject.lab_duration_hours || 1;
    return duration === 2 ? "2h Lab" : "Lab";
  }
  
  return "";
};

/**
 * Get visual indicators for multi-hour lessons
 */
export const getMultiHourLessonStyle = (
  lesson: Lesson,
  subjects: Subject[]
): {
  isMultiHour: boolean;
  isContinuation: boolean;
  borderStyle: string;
  badgeText: string;
} => {
  const isMultiHour = isLessonMultiHour(lesson, subjects);
  const isContinuation = lesson.is_continuation || false;
  
  return {
    isMultiHour,
    isContinuation,
    borderStyle: isMultiHour ? "border-l-4 border-l-orange-500" : "",
    badgeText: isMultiHour ? (isContinuation ? "2h Lab - Slot 2" : "2h Lab") : "Lab"
  };
};