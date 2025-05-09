
import { Class, Teacher, Subject, TimeSlot, Lesson, Timetable, Batch, Classroom } from "@/types";

// Helper function to generate a simple ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Mock Classes
export const classes: Class[] = [
  { id: "c1", name: "Year 1 Computer Science", year: 1, batches: [] },
  { id: "c2", name: "Year 2 Computer Science", year: 2, batches: [] },
  { id: "c3", name: "Year 1 Electronics", year: 1, batches: [] },
  { id: "c4", name: "Year 2 Electronics", year: 2, batches: [] },
  { id: "c5", name: "Year 1 Mathematics", year: 1, batches: [] },
];

// Mock Batches
export const batches: Batch[] = [
  { id: "b1", name: "Batch A", classId: "c1" },
  { id: "b2", name: "Batch B", classId: "c1" },
  { id: "b3", name: "Batch A", classId: "c2" },
];

// Initialize the batches for classes
classes[0].batches = batches.filter(b => b.classId === "c1");
classes[1].batches = batches.filter(b => b.classId === "c2");

// Mock Subjects
export const subjects: Subject[] = [
  { id: "s1", name: "Introduction to Programming", code: "CS101", periodsPerWeek: 5, classes: ["c1"] },
  { id: "s2", name: "Data Structures", code: "CS201", periodsPerWeek: 4, classes: ["c2"] },
  { id: "s3", name: "Digital Logic", code: "EC101", periodsPerWeek: 3, classes: ["c3"] },
  { id: "s4", name: "Linear Algebra", code: "MA101", periodsPerWeek: 4, classes: ["c5"] },
  { id: "s5", name: "Calculus", code: "MA201", periodsPerWeek: 5, classes: ["c5"] },
  { id: "s6", name: "Computer Networks", code: "CS301", periodsPerWeek: 3, classes: ["c2"] },
  { id: "s7", name: "Database Systems", code: "CS401", periodsPerWeek: 4, classes: ["c2"] },
  { id: "s8", name: "Signals and Systems", code: "EC201", periodsPerWeek: 3, classes: ["c4"] },
];

// Mock Teachers
export const teachers: Teacher[] = [
  { id: "t1", name: "Dr. Jane Smith", email: "jane.smith@college.edu", subjects: ["s1", "s2"] },
  { id: "t2", name: "Prof. John Doe", email: "john.doe@college.edu", subjects: ["s3", "s8"] },
  { id: "t3", name: "Dr. Sarah Johnson", email: "sarah.j@college.edu", subjects: ["s4", "s5"] },
  { id: "t4", name: "Prof. Michael Brown", email: "m.brown@college.edu", subjects: ["s6", "s7"] },
  { id: "t5", name: "Dr. Lisa Chen", email: "l.chen@college.edu", subjects: ["s1", "s6"] },
];

// Mock Time Slots
export const timeSlots: TimeSlot[] = [
  { id: "ts1", name: "Period 1", startTime: "09:00", endTime: "10:00", isBreak: false },
  { id: "ts2", name: "Period 2", startTime: "10:00", endTime: "11:00", isBreak: false },
  { id: "ts3", name: "Period 3", startTime: "11:00", endTime: "12:00", isBreak: false },
  { id: "ts4", name: "Lunch", startTime: "12:00", endTime: "13:00", isBreak: true },
  { id: "ts5", name: "Period 4", startTime: "13:00", endTime: "14:00", isBreak: false },
  { id: "ts6", name: "Period 5", startTime: "14:00", endTime: "15:00", isBreak: false },
  { id: "ts7", name: "Short Break", startTime: "15:00", endTime: "15:15", isBreak: true },
  { id: "ts8", name: "Period 6", startTime: "15:15", endTime: "16:15", isBreak: false },
];

// Mock Classrooms
export const classrooms: Classroom[] = [
  { id: "cr1", name: "Room 101", capacity: 40, isLab: false },
  { id: "cr2", name: "Room 102", capacity: 30, isLab: false },
  { id: "cr3", name: "Computer Lab", capacity: 25, isLab: true },
  { id: "cr4", name: "Electronics Lab", capacity: 20, isLab: true },
];

// Improved helper function to generate lessons with conflict avoidance
const generateLessons = (): Lesson[] => {
  const lessons: Lesson[] = [];
  const teacherSchedule: Record<string, Record<number, Record<string, boolean>>> = {};
  const classSchedule: Record<string, Record<number, Record<string, boolean>>> = {};
  const classroomSchedule: Record<string, Record<number, Record<string, boolean>>> = {};
  
  // Initialize schedule trackers
  teachers.forEach(teacher => {
    teacherSchedule[teacher.id] = {};
    for (let day = 0; day < 6; day++) { // Include Saturday (0-5)
      teacherSchedule[teacher.id][day] = {};
    }
  });
  
  classes.forEach(cls => {
    classSchedule[cls.id] = {};
    for (let day = 0; day < 6; day++) {
      classSchedule[cls.id][day] = {};
    }
  });
  
  classrooms.forEach(classroom => {
    classroomSchedule[classroom.id] = {};
    for (let day = 0; day < 6; day++) {
      classroomSchedule[classroom.id][day] = {};
    }
  });
  
  // For each class, assign lessons
  classes.forEach(cls => {
    // For each day of the week (0-5, Monday to Saturday)
    for (let day = 0; day < 6; day++) {
      // For each teaching time slot
      const teachingSlots = timeSlots.filter(ts => !ts.isBreak);
      
      teachingSlots.forEach(timeSlot => {
        // Find eligible subjects and teachers
        const eligibleTeachers = teachers.filter(teacher => {
          // Check if teacher is available at this time
          return !teacherSchedule[teacher.id][day][timeSlot.id];
        });
        
        if (eligibleTeachers.length > 0) {
          // Select a random eligible teacher
          const teacherIndex = Math.floor(Math.random() * eligibleTeachers.length);
          const teacher = eligibleTeachers[teacherIndex];
          
          // Find a subject this teacher can teach
          const eligibleSubjects = subjects.filter(subject => 
            teacher.subjects.includes(subject.id)
          );
          
          if (eligibleSubjects.length > 0) {
            // Select a random eligible subject
            const subjectIndex = Math.floor(Math.random() * eligibleSubjects.length);
            const subject = eligibleSubjects[subjectIndex];
            
            // Find an available classroom
            const isLabSubject = subject.name.toLowerCase().includes('lab') || subject.code.toLowerCase().includes('lab');
            
            const eligibleClassrooms = classrooms.filter(classroom => {
              // Check if classroom is available at this time and matches lab requirement
              return !classroomSchedule[classroom.id][day][timeSlot.id] && 
                    ((isLabSubject && classroom.isLab) || (!isLabSubject && !classroom.isLab));
            });
            
            if (eligibleClassrooms.length > 0) {
              // Select a random eligible classroom
              const classroomIndex = Math.floor(Math.random() * eligibleClassrooms.length);
              const classroom = eligibleClassrooms[classroomIndex];
              
              // Mark this slot as occupied for teacher, class, and classroom
              teacherSchedule[teacher.id][day][timeSlot.id] = true;
              classSchedule[cls.id][day][timeSlot.id] = true;
              classroomSchedule[classroom.id][day][timeSlot.id] = true;
              
              // Create the lesson
              lessons.push({
                id: generateId(),
                classId: cls.id,
                subjectId: subject.id,
                teacherId: teacher.id,
                day,
                timeSlotId: timeSlot.id,
                classroomId: classroom.id
              });
            }
          }
        }
      });
    }
  });
  
  return lessons;
};

// Mock Timetable
export const timetable: Timetable = {
  id: "tt1",
  name: "Academic Year 2023-2024 Semester 1",
  academicYear: "2023-2024",
  lessons: generateLessons(),
};

// Data Service
export const DataService = {
  getClasses: () => Promise.resolve([...classes]),
  getTeachers: () => Promise.resolve([...teachers]),
  getSubjects: () => Promise.resolve([...subjects]),
  getTimeSlots: () => Promise.resolve([...timeSlots]),
  getTimetable: () => Promise.resolve({...timetable}),
  getClassrooms: () => Promise.resolve([...classrooms]),
  
  // CRUD operations for classes
  addClass: (newClass: Omit<Class, "id" | "batches">) => {
    const classWithId = { ...newClass, id: generateId(), batches: [] };
    classes.push(classWithId);
    return Promise.resolve(classWithId);
  },
  
  updateClass: (updatedClass: Class) => {
    const index = classes.findIndex(c => c.id === updatedClass.id);
    if (index !== -1) {
      // Preserve batches if they're not included in the update
      if (!updatedClass.batches) {
        updatedClass.batches = classes[index].batches;
      }
      classes[index] = updatedClass;
      return Promise.resolve(updatedClass);
    }
    return Promise.reject("Class not found");
  },
  
  deleteClass: (id: string) => {
    const index = classes.findIndex(c => c.id === id);
    if (index !== -1) {
      const deletedClass = classes.splice(index, 1)[0];
      // Also delete any lessons associated with this class
      const updatedLessons = timetable.lessons.filter(l => l.classId !== id);
      timetable.lessons = updatedLessons;
      return Promise.resolve(deletedClass);
    }
    return Promise.reject("Class not found");
  },
  
  // CRUD operations for teachers
  addTeacher: (newTeacher: Omit<Teacher, "id">) => {
    const teacherWithId = { ...newTeacher, id: generateId() };
    teachers.push(teacherWithId);
    return Promise.resolve(teacherWithId);
  },
  
  updateTeacher: (updatedTeacher: Teacher) => {
    const index = teachers.findIndex(t => t.id === updatedTeacher.id);
    if (index !== -1) {
      teachers[index] = updatedTeacher;
      return Promise.resolve(updatedTeacher);
    }
    return Promise.reject("Teacher not found");
  },
  
  deleteTeacher: (id: string) => {
    const index = teachers.findIndex(t => t.id === id);
    if (index !== -1) {
      const deletedTeacher = teachers.splice(index, 1)[0];
      // Also delete any lessons associated with this teacher
      const updatedLessons = timetable.lessons.filter(l => l.teacherId !== id);
      timetable.lessons = updatedLessons;
      return Promise.resolve(deletedTeacher);
    }
    return Promise.reject("Teacher not found");
  },
  
  // CRUD operations for subjects
  addSubject: (newSubject: Omit<Subject, "id">) => {
    const subjectWithId = { ...newSubject, id: generateId() };
    subjects.push(subjectWithId);
    return Promise.resolve(subjectWithId);
  },
  
  updateSubject: (updatedSubject: Subject) => {
    const index = subjects.findIndex(s => s.id === updatedSubject.id);
    if (index !== -1) {
      subjects[index] = updatedSubject;
      return Promise.resolve(updatedSubject);
    }
    return Promise.reject("Subject not found");
  },
  
  deleteSubject: (id: string) => {
    const index = subjects.findIndex(s => s.id === id);
    if (index !== -1) {
      const deletedSubject = subjects.splice(index, 1)[0];
      // Also delete any lessons associated with this subject
      const updatedLessons = timetable.lessons.filter(l => l.subjectId !== id);
      timetable.lessons = updatedLessons;
      return Promise.resolve(deletedSubject);
    }
    return Promise.reject("Subject not found");
  },
  
  // CRUD operations for time slots
  addTimeSlot: (newTimeSlot: Omit<TimeSlot, "id">) => {
    const timeSlotWithId = { ...newTimeSlot, id: generateId() };
    timeSlots.push(timeSlotWithId);
    return Promise.resolve(timeSlotWithId);
  },
  
  updateTimeSlot: (updatedTimeSlot: TimeSlot) => {
    const index = timeSlots.findIndex(ts => ts.id === updatedTimeSlot.id);
    if (index !== -1) {
      timeSlots[index] = updatedTimeSlot;
      return Promise.resolve(updatedTimeSlot);
    }
    return Promise.reject("Time slot not found");
  },
  
  deleteTimeSlot: (id: string) => {
    const index = timeSlots.findIndex(ts => ts.id === id);
    if (index !== -1) {
      const deletedTimeSlot = timeSlots.splice(index, 1)[0];
      // Also delete any lessons associated with this time slot
      const updatedLessons = timetable.lessons.filter(l => l.timeSlotId !== id);
      timetable.lessons = updatedLessons;
      return Promise.resolve(deletedTimeSlot);
    }
    return Promise.reject("Time slot not found");
  },
  
  // CRUD operations for classrooms
  addClassroom: (newClassroom: Omit<Classroom, "id">) => {
    const classroomWithId = { ...newClassroom, id: generateId() };
    classrooms.push(classroomWithId);
    return Promise.resolve(classroomWithId);
  },
  
  updateClassroom: (updatedClassroom: Classroom) => {
    const index = classrooms.findIndex(c => c.id === updatedClassroom.id);
    if (index !== -1) {
      classrooms[index] = updatedClassroom;
      return Promise.resolve(updatedClassroom);
    }
    return Promise.reject("Classroom not found");
  },
  
  deleteClassroom: (id: string) => {
    const index = classrooms.findIndex(c => c.id === id);
    if (index !== -1) {
      const deletedClassroom = classrooms.splice(index, 1)[0];
      // Also update any lessons that used this classroom to have no classroom assigned
      timetable.lessons.forEach(lesson => {
        if (lesson.classroomId === id) {
          lesson.classroomId = undefined;
        }
      });
      return Promise.resolve(deletedClassroom);
    }
    return Promise.reject("Classroom not found");
  },

  // Timetable operations
  generateTimetable: () => {
    // Generate a new timetable with improved algorithm
    timetable.lessons = generateLessons();
    return Promise.resolve({...timetable});
  },
  
  updateLesson: (updatedLesson: Lesson) => {
    const index = timetable.lessons.findIndex(l => l.id === updatedLesson.id);
    if (index !== -1) {
      timetable.lessons[index] = updatedLesson;
      return Promise.resolve(updatedLesson);
    }
    return Promise.reject("Lesson not found");
  },
  
  addLesson: (newLesson: Omit<Lesson, "id">) => {
    const lessonWithId = { ...newLesson, id: generateId() };
    timetable.lessons.push(lessonWithId);
    return Promise.resolve(lessonWithId);
  },
  
  deleteLesson: (id: string) => {
    const index = timetable.lessons.findIndex(l => l.id === id);
    if (index !== -1) {
      const deletedLesson = timetable.lessons.splice(index, 1)[0];
      return Promise.resolve(deletedLesson);
    }
    return Promise.reject("Lesson not found");
  },

  // Helper methods for derived data
  getTeacherTimetable: (teacherId: string) => {
    const teacherLessons = timetable.lessons.filter(l => l.teacherId === teacherId);
    return Promise.resolve({
      ...timetable,
      lessons: teacherLessons,
    });
  },
  
  getClassTimetable: (classId: string) => {
    const classLessons = timetable.lessons.filter(l => l.classId === classId);
    return Promise.resolve({
      ...timetable,
      lessons: classLessons,
    });
  },
  
  getClassroomTimetable: (classroomId: string) => {
    const classroomLessons = timetable.lessons.filter(l => l.classroomId === classroomId);
    return Promise.resolve({
      ...timetable,
      lessons: classroomLessons,
    });
  },

  // Batch operations
  getBatchesByClass: (classId: string) => {
    return Promise.resolve(batches.filter(b => b.classId === classId));
  },
  
  addBatch: (newBatch: Omit<Batch, "id">) => {
    const batchWithId = { ...newBatch, id: generateId() };
    batches.push(batchWithId);
    
    // Update the batches array in the corresponding class
    const classIndex = classes.findIndex(c => c.id === newBatch.classId);
    if (classIndex !== -1) {
      if (!classes[classIndex].batches) {
        classes[classIndex].batches = [];
      }
      classes[classIndex].batches?.push(batchWithId);
    }
    
    return Promise.resolve(batchWithId);
  },
  
  updateBatch: (updatedBatch: Batch) => {
    const index = batches.findIndex(b => b.id === updatedBatch.id);
    if (index !== -1) {
      batches[index] = updatedBatch;
      
      // Update the batch in the corresponding class
      const classIndex = classes.findIndex(c => c.id === updatedBatch.classId);
      if (classIndex !== -1 && classes[classIndex].batches) {
        const batchIndex = classes[classIndex].batches?.findIndex(b => b.id === updatedBatch.id);
        if (batchIndex !== -1 && classes[classIndex].batches) {
          classes[classIndex].batches[batchIndex] = updatedBatch;
        }
      }
      
      return Promise.resolve(updatedBatch);
    }
    return Promise.reject("Batch not found");
  },
  
  deleteBatch: (id: string) => {
    const index = batches.findIndex(b => b.id === id);
    if (index !== -1) {
      const deletedBatch = batches.splice(index, 1)[0];
      
      // Remove the batch from the corresponding class
      const classIndex = classes.findIndex(c => c.id === deletedBatch.classId);
      if (classIndex !== -1 && classes[classIndex].batches) {
        classes[classIndex].batches = classes[classIndex].batches?.filter(b => b.id !== id);
      }
      
      return Promise.resolve(deletedBatch);
    }
    return Promise.reject("Batch not found");
  },

  // Share methods
  shareTimetable: (method: "whatsapp" | "email" | "download", timetableId: string, view: string, entityId?: string) => {
    // This would be implemented with actual sharing logic in a real app
    return Promise.resolve({ success: true, method, timetableId, view, entityId });
  },
};
