
// Class represents a group of students
export interface Class {
  id: string;
  name: string; // e.g., "Year 1 Computer Science"
  year: number; // academic year
  batches?: Batch[]; // batches in this class
}

// Batch represents a subdivision of a class
export interface Batch {
  id: string;
  name: string; // e.g., "Batch A"
  classId: string;
}

// Teacher represents a faculty member
export interface Teacher {
  id: string;
  name: string;
  email?: string;
  subjects: string[]; // subjects they can teach (IDs)
}

// Subject represents a course
export interface Subject {
  id: string;
  name: string;
  code: string; // e.g., "CS101"
}

// TimeSlot represents a period in the day
export interface TimeSlot {
  id: string;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:00"
  isBreak: boolean; // true if this is a recess/lunch period
}

// Lesson represents a single class in the timetable
export interface Lesson {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: number; // 0 for Monday, 1 for Tuesday, etc.
  timeSlotId: string;
  batchId?: string; // optional batch identifier
}

// Timetable represents the full schedule
export interface Timetable {
  id: string;
  name: string;
  lessons: Lesson[];
}

// TimetableView is used to display different views of a timetable
export type TimetableView = "master" | "teacher" | "class";

// Share method types
export type ShareMethod = "whatsapp" | "email" | "download";
