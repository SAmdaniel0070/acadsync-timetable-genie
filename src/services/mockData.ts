// Simple mock data for pages that haven't been migrated to Supabase yet
export const mockClasses = [];
export const mockSubjects = [];
export const mockTeachers = [];
export const mockClassrooms = [];
export const mockTimeSlots = [];
export const mockTimetables = [];

// Mock DataService for compatibility
export const DataService = {
  getClasses: async () => mockClasses,
  getSubjects: async () => mockSubjects,
  getTeachers: async () => mockTeachers,
  getClassrooms: async () => mockClassrooms,
  getTimeSlots: async () => mockTimeSlots,
  getTimetables: async () => mockTimetables,
  addSubject: async () => ({}),
  updateSubject: async () => ({}),
  deleteSubject: async () => ({}),
  addClass: async () => ({}),
  updateClass: async () => ({}),
  deleteClass: async () => ({}),
  addTeacher: async () => ({}),
  updateTeacher: async () => ({}),
  deleteTeacher: async () => ({}),
  addClassroom: async () => ({}),
  updateClassroom: async () => ({}),
  deleteClassroom: async () => ({}),
  addTimeSlot: async () => ({}),
  updateTimeSlot: async () => ({}),
  deleteTimeSlot: async () => ({}),
};

// For compatibility with existing imports
export default {
  classes: mockClasses,
  subjects: mockSubjects,
  teachers: mockTeachers,
  classrooms: mockClassrooms,
  timeSlots: mockTimeSlots,
  timetables: mockTimetables,
};