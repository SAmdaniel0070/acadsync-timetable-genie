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
  getTimetable: async () => mockTimetables[0] || null,
  addSubject: async (data: any) => ({ id: 'mock-id', ...data }),
  updateSubject: async (data: any) => ({ id: 'mock-id', ...data }),
  deleteSubject: async (id: string) => true,
  addClass: async (data: any) => ({ id: 'mock-id', ...data }),
  updateClass: async (data: any) => ({ id: 'mock-id', ...data }),
  deleteClass: async (id: string) => true,
  addBatch: async (data: any) => ({ id: 'mock-id', ...data }),
  deleteBatch: async (id: string) => true,
  addTeacher: async (data: any) => ({ id: 'mock-id', ...data }),
  updateTeacher: async (data: any) => ({ id: 'mock-id', ...data }),
  deleteTeacher: async (id: string) => true,
  addClassroom: async (data: any) => ({ id: 'mock-id', ...data }),
  updateClassroom: async (data: any) => ({ id: 'mock-id', ...data }),
  deleteClassroom: async (id: string) => true,
  addTimeSlot: async (data: any) => ({ id: 'mock-id', ...data }),
  updateTimeSlot: async (data: any) => ({ id: 'mock-id', ...data }),
  deleteTimeSlot: async (id: string) => true,
  shareTimetable: async (data: any) => ({ success: true, ...data }),
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