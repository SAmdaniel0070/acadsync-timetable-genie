
import {
  Timetable,
  Class,
  Teacher,
  Subject,
  TimeSlot,
  Classroom,
  Batch,
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

// Helper function to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Mock data service methods
export const DataService = {
  // Fetch timetable data
  getTimetable: async (): Promise<Timetable> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({...mockTimetable});
      }, 500);
    });
  },

  // Fetch classes
  getClasses: async (): Promise<Class[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockClasses]);
      }, 500);
    });
  },

  // Fetch teachers
  getTeachers: async (): Promise<Teacher[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockTeachers]);
      }, 500);
    });
  },

  // Fetch subjects
  getSubjects: async (): Promise<Subject[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockSubjects]);
      }, 500);
    });
  },

  // Fetch time slots
  getTimeSlots: async (): Promise<TimeSlot[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockTimeSlots]);
      }, 500);
    });
  },

  // Fetch classrooms
  getClassrooms: async (): Promise<Classroom[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockClassrooms]);
      }, 500);
    });
  },

  // Fetch batches by class ID
  getBatchesByClass: async (classId: string): Promise<Batch[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredBatches = mockBatches.filter((batch) => batch.classId === classId);
        resolve([...filteredBatches]);
      }, 300);
    });
  },

  // Generate new timetable
  generateTimetable: async (): Promise<Timetable> => {
    const timetableGenerator = await import("../../utils/timetableGenerator");
    
    return new Promise(async (resolve) => {
      setTimeout(async () => {
        try {
          // Get all necessary data for timetable generation
          const classes = mockClasses;
          const subjects = mockSubjects;
          const teachers = mockTeachers;
          const timeSlots = mockTimeSlots;
          const classrooms = mockClassrooms;
          
          // Generate lessons using the algorithm
          const generatedLessons = await timetableGenerator.generateTimetable({
            classes,
            subjects, 
            teachers,
            timeSlots,
            classrooms,
            workingDays: [0, 1, 2, 3, 4] // Monday to Friday
          });
          
          // Create lesson objects with IDs
          const lessonsWithIds = generatedLessons.map(lesson => ({
            ...lesson,
            id: generateId()
          }));
          
          // Update the mock timetable
          mockTimetable.lessons = lessonsWithIds;
          mockTimetable.id = generateId();
          
          console.log("Generated new timetable with", lessonsWithIds.length, "lessons");
          
          resolve({...mockTimetable});
        } catch (error) {
          console.error("Error generating timetable:", error);
          resolve({
            id: generateId(),
            name: "Generated Timetable",
            academicYear: "2024-2025",
            lessons: []
          });
        }
      }, 1000);
    });
  },

  // Update an existing lesson
  updateLesson: async (lesson: Lesson): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockTimetable.lessons.findIndex(l => l.id === lesson.id);
        if (index !== -1) {
          mockTimetable.lessons[index] = lesson;
          console.log("Lesson updated:", lesson);
        } else {
          console.warn("Lesson not found for update:", lesson.id);
        }
        resolve();
      }, 300);
    });
  },

  // Delete a lesson
  deleteLesson: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockTimetable.lessons.findIndex(l => l.id === id);
        if (index !== -1) {
          mockTimetable.lessons.splice(index, 1);
          console.log("Lesson deleted:", id);
        } else {
          console.warn("Lesson not found for deletion:", id);
        }
        resolve();
      }, 300);
    });
  },

  // Add a new lesson
  addLesson: async (lesson: Omit<Lesson, "id">): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newLesson = {
          ...lesson,
          id: generateId()
        };
        mockTimetable.lessons.push(newLesson);
        console.log("Lesson added:", newLesson);
        resolve();
      }, 300);
    });
  },

  // Get a subject by ID
  getSubjectById: async (id: string): Promise<Subject | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const subject = mockSubjects.find((s) => s.id === id);
        resolve(subject);
      }, 300);
    });
  },

  // Add a new class
  addClass: async (newClass: Omit<Class, "id">): Promise<Class> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = generateId();
        const createdClass: Class = { ...newClass, id };
        mockClasses.push(createdClass);
        resolve(createdClass);
      }, 500);
    });
  },

  // Update an existing class
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

  // Delete a class
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

  // Add a new subject
  addSubject: async (newSubject: Omit<Subject, "id">): Promise<Subject> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = generateId();
        const subjectWithId: Subject = { 
          ...newSubject, 
          id 
        };
        mockSubjects.push(subjectWithId);
        resolve(subjectWithId);
      }, 500);
    });
  },
  
  // Update an existing subject
  updateSubject: async (updatedSubject: Subject): Promise<Subject> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockSubjects.findIndex((s) => s.id === updatedSubject.id);
        if (index !== -1) {
          mockSubjects[index] = updatedSubject;
        }
        resolve(updatedSubject);
      }, 500);
    });
  },

  // Delete a subject
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
  
  // Update the entire timetable
  updateTimetable: async (timetable: Timetable): Promise<Timetable> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Updating timetable:', timetable);
        // Deep clone the timetable to avoid reference issues
        const updatedTimetable = JSON.parse(JSON.stringify(timetable));
        Object.assign(mockTimetable, updatedTimetable);
        resolve({...mockTimetable});
      }, 500);
    });
  },

  // Update a time slot
  updateTimeSlot: async (updatedTimeSlot: TimeSlot): Promise<TimeSlot> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockTimeSlots.findIndex((ts) => ts.id === updatedTimeSlot.id);
        if (index !== -1) {
          mockTimeSlots[index] = updatedTimeSlot;
          resolve(updatedTimeSlot);
        } else {
          reject(new Error("Time slot not found"));
        }
      }, 500);
    });
  },
  
  // Add a new time slot
  addTimeSlot: async (newTimeSlot: Omit<TimeSlot, "id">): Promise<TimeSlot> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = generateId();
        const timeSlotWithId: TimeSlot = { ...newTimeSlot, id };
        mockTimeSlots.push(timeSlotWithId);
        resolve(timeSlotWithId);
      }, 500);
    });
  },
  
  // Delete a time slot
  deleteTimeSlot: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockTimeSlots.findIndex((ts) => ts.id === id);
        if (index !== -1) {
          mockTimeSlots.splice(index, 1);
        }
        resolve();
      }, 500);
    });
  },
};
