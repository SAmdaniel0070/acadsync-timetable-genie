
import {
  Timetable,
  Class,
  Teacher,
  Subject,
  TimeSlot,
  Classroom,
  Batch,
  SubjectFormValues,
  Lesson
} from "@/types";

const mockTimetable: Timetable = {
  id: "1",
  name: "Timetable 2024",
  academicYear: "2024-2025",
  lessons: [
    {
      id: "101",
      day: 0,
      timeSlotId: "1",
      classId: "1",
      subjectId: "1",
      teacherId: "1",
      classroomId: "1",
    },
    {
      id: "102",
      day: 1,
      timeSlotId: "2",
      classId: "2",
      subjectId: "2",
      teacherId: "2",
      classroomId: "2",
    },
    {
      id: "103",
      day: 2,
      timeSlotId: "3",
      classId: "3",
      subjectId: "3",
      teacherId: "3",
      classroomId: "3",
    },
    {
      id: "104",
      day: 3,
      timeSlotId: "4",
      classId: "1",
      subjectId: "4",
      teacherId: "4",
      classroomId: "4",
    },
    {
      id: "105",
      day: 4,
      timeSlotId: "5",
      classId: "2",
      subjectId: "5",
      teacherId: "5",
      classroomId: "1",
    },
  ],
};

const mockClasses: Class[] = [
  { id: "1", name: "Class A", year: 1 },
  { id: "2", name: "Class B", year: 1 },
  { id: "3", name: "Class C", year: 2 },
];

const mockTeachers: Teacher[] = [
  { id: "1", name: "Mr. Smith", subjects: ["1", "4"] },
  { id: "2", name: "Ms. Johnson", subjects: ["2", "5"] },
  { id: "3", name: "Mr. Williams", subjects: ["3"] },
];

const mockSubjects: Subject[] = [
  { id: "1", name: "Math", code: "M101", classes: ["1"], periodsPerWeek: 5 },
  { id: "2", name: "Science", code: "S101", classes: ["2"], periodsPerWeek: 4 },
  { id: "3", name: "English", code: "E101", classes: ["3"], periodsPerWeek: 5 },
  { id: "4", name: "History", code: "H101", classes: ["1"], periodsPerWeek: 3 },
  { id: "5", name: "Art", code: "A101", classes: ["2"], periodsPerWeek: 2 },
];

const mockTimeSlots: TimeSlot[] = [
  { id: "1", name: "9:00 - 10:00", startTime: "9:00", endTime: "10:00", isBreak: false },
  { id: "2", name: "10:00 - 11:00", startTime: "10:00", endTime: "11:00", isBreak: false },
  { id: "3", name: "11:00 - 12:00", startTime: "11:00", endTime: "12:00", isBreak: true },
  { id: "4", name: "12:00 - 13:00", startTime: "12:00", endTime: "13:00", isBreak: false },
  { id: "5", name: "13:00 - 14:00", startTime: "13:00", endTime: "14:00", isBreak: false },
];

const mockClassrooms: Classroom[] = [
  { id: "1", name: "Room 101", capacity: 30, isLab: false },
  { id: "2", name: "Room 102", capacity: 25, isLab: false },
  { id: "3", name: "Lab A", capacity: 20, isLab: true },
  { id: "4", name: "Lab B", capacity: 15, isLab: true },
];

const mockBatches: Batch[] = [
  { id: "1", name: "Batch A", classId: "1" },
  { id: "2", name: "Batch B", classId: "1" },
  { id: "3", name: "Batch C", classId: "2" },
];

// Mock data service methods
export const DataService = {
  getTimetable: async (): Promise<Timetable> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockTimetable);
      }, 500);
    });
  },

  getClasses: async (): Promise<Class[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockClasses);
      }, 500);
    });
  },

  getTeachers: async (): Promise<Teacher[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockTeachers);
      }, 500);
    });
  },

  getSubjects: async (): Promise<Subject[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockSubjects);
      }, 500);
    });
  },

  getTimeSlots: async (): Promise<TimeSlot[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockTimeSlots);
      }, 500);
    });
  },

  getClassrooms: async (): Promise<Classroom[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockClassrooms);
      }, 500);
    });
  },

  getBatchesByClass: async (classId: string): Promise<Batch[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const batches = mockBatches.filter((batch) => batch.classId === classId);
        resolve(batches);
      }, 300);
    });
  },

  generateTimetable: async (): Promise<Timetable> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: "2",
          name: "Generated Timetable",
          academicYear: "2024-2025",
          lessons: [],
        });
      }, 1000);
    });
  },

  updateLesson: async (lesson: Lesson): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Lesson updated:", lesson);
        resolve();
      }, 300);
    });
  },

  deleteLesson: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Lesson deleted:", id);
        resolve();
      }, 300);
    });
  },

  addLesson: async (lesson: Omit<Lesson, "id">): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Lesson added:", lesson);
        resolve();
      }, 300);
    });
  },

  getSubjectById: async (id: string): Promise<Subject | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const subject = mockSubjects.find((s) => s.id === id);
        resolve(subject);
      }, 300);
    });
  },

  addClass: async (newClass: Omit<Class, "id">): Promise<Class> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = Math.random().toString(36).substring(7);
        const createdClass: Class = { ...newClass, id };
        mockClasses.push(createdClass);
        resolve(createdClass);
      }, 500);
    });
  },

  updateClass: async (updatedClass: Class): Promise<Class> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockClasses.findIndex((c) => c.id === updatedClass.id);
        if (index !== -1) {
          mockClasses[index] = updatedClass;
          resolve(updatedClass);
        } else {
          reject(new Error("Class not found"));
        }
      }, 500);
    });
  },

  deleteClass: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockClasses.findIndex((c) => c.id === id);
        if (index !== -1) {
          mockClasses.splice(index, 1);
        }
        resolve();
      }, 500);
    });
  },

  addSubject: async (subjectData: SubjectFormValues): Promise<Subject> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newSubject: Subject = {
          id: Math.random().toString(36).substring(7),
          ...subjectData,
        };
        mockSubjects.push(newSubject);
        resolve(newSubject);
      }, 500);
    });
  },

  updateSubject: async (subjectData: Subject): Promise<Subject> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockSubjects.findIndex((s) => s.id === subjectData.id);
        if (index !== -1) {
          mockSubjects[index] = subjectData;
        }
        resolve(subjectData);
      }, 500);
    });
  },

  deleteSubject: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockSubjects.findIndex((s) => s.id === id);
        if (index !== -1) {
          mockSubjects.splice(index, 1);
        }
        resolve();
      }, 500);
    });
  },
  
  updateTimetable: async (timetable: Timetable): Promise<Timetable> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real application, this would make an API call
        console.log('Updating timetable:', timetable);
        // For mock service, we'll just update our local copy
        Object.assign(mockTimetable, timetable);
        resolve({...mockTimetable});
      }, 500);
    });
  }
};
