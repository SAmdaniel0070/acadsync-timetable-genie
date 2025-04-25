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
  classes?: string[]; // Array of class IDs this subject is assigned to
  periodsPerWeek: number; // Number of periods per week for this subject
  isLab?: boolean; // Indicates if this subject requires a lab
}

// TimeSlot represents a period in the day
export interface TimeSlot {
  id: string;
  name: string; // e.g., "Period 1"
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:00"
  isBreak: boolean; // true if this is a recess/lunch period
}

// Classroom represents a physical room where lessons can be held
export interface Classroom {
  id: string;
  name: string;
  capacity: number; // number of students the room can accommodate
  isLab: boolean; // true if this room is a laboratory
  building?: string; // optional building name
  floor?: number; // optional floor number
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
  classroomId?: string; // optional classroom identifier
}

// Timetable represents the full schedule
export interface Timetable {
  id: string;
  name: string;
  academicYear: string;
  lessons: Lesson[];
}

// Form values interfaces
export interface SubjectFormValues {
  name: string;
  code: string;
  classes?: string[];
  periodsPerWeek: number;
}

// TimetableView is used to display different views of a timetable
export type TimetableView = "master" | "teacher" | "class" | "classroom";

// Share method types
export type ShareMethod = "whatsapp" | "email" | "download";

// EditMode for timetable
export type EditMode = "none" | "edit";
