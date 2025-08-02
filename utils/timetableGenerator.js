
/**
 * Timetable Generation Algorithm
 * 
 * This utility handles the complex task of generating timetables while respecting
 * various constraints and requirements.
 */

// Helper function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  const arrayCopy = [...array];
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }
  return arrayCopy;
};

// Check if a teacher is already assigned at a specific day and time slot
const isTeacherBusy = (teacherId, day, timeSlotId, lessons) => {
  return lessons.some(lesson => 
    lesson.teacherId.toString() === teacherId.toString() && 
    lesson.day === day && 
    lesson.timeSlotId.toString() === timeSlotId.toString()
  );
};

// Check if a class is already busy at a specific day and time slot
const isClassBusy = (classId, day, timeSlotId, lessons) => {
  return lessons.some(lesson => 
    lesson.classId.toString() === classId.toString() && 
    lesson.day === day && 
    lesson.timeSlotId.toString() === timeSlotId.toString()
  );
};

// Check if a classroom is already occupied at a specific day and time slot
const isClassroomOccupied = (classroomId, day, timeSlotId, lessons) => {
  if (!classroomId) return false;
  
  return lessons.some(lesson => 
    lesson.classroomId && 
    lesson.classroomId.toString() === classroomId.toString() && 
    lesson.day === day && 
    lesson.timeSlotId.toString() === timeSlotId.toString()
  );
};

// Count how many times a subject is scheduled for a class in the timetable
const getSubjectCount = (classId, subjectId, lessons) => {
  return lessons.filter(lesson => 
    lesson.classId.toString() === classId.toString() && 
    lesson.subjectId.toString() === subjectId.toString()
  ).length;
};

// Count how many lectures a teacher has on a specific day
const getTeacherDailyCount = (teacherId, day, lessons) => {
  return lessons.filter(lesson => 
    lesson.teacherId.toString() === teacherId.toString() && 
    lesson.day === day
  ).length;
};

// Find suitable classroom for a subject
const findSuitableClassroom = (subject, classrooms, day, timeSlotId, lessons) => {
  if (!classrooms || classrooms.length === 0) {
    return null;
  }

  // Filter classrooms based on subject type (lab/regular) and availability
  const suitableClassrooms = classrooms.filter(classroom => {
    const isLabClass = subject.isLab || (subject.name && subject.name.toLowerCase().includes('lab'));
    const isClassroomSuitable = isLabClass ? classroom.isLab : !classroom.isLab;
    const isAvailable = !isClassroomOccupied(classroom._id || classroom.id, day, timeSlotId, lessons);
    
    return isClassroomSuitable && isAvailable;
  });
  
  if (suitableClassrooms.length === 0) {
    return null;
  }
  
  // Sort by capacity - choose the smallest room that fits
  suitableClassrooms.sort((a, b) => a.capacity - b.capacity);
  return suitableClassrooms[0];
};

/**
 * Generate a timetable based on the given inputs with improved conflict resolution
 * 
 * @param {Object} params - The parameters for timetable generation
 * @returns {Array} Generated lessons for the timetable
 */
exports.generateTimetable = async ({
  classes,
  subjects,
  teachers,
  timeSlots,
  classrooms,
  workingDays = [0, 1, 2, 3, 4, 5] // Default: Monday to Saturday
}) => {
  if (!classes || !subjects || !teachers || !timeSlots) {
    console.error("Missing required parameters for timetable generation");
    return [];
  }
  
  // Filter out break periods
  const teachingSlots = timeSlots.filter(slot => !slot.isBreak);
  
  // Store the generated lessons
  const lessons = [];
  const maxAttemptsPerSubject = 10; // Maximum attempts to schedule each subject
  
  // For each class, assign subjects to time slots
  for (const cls of classes) {
    const classId = cls._id || cls.id;
    
    // Get subjects for this class
    const classSubjects = subjects.filter(subject => 
      subject.classes && subject.classes.some(clsId => 
        clsId.toString() === classId.toString()
      )
    );
    
    // For each subject, distribute across time slots
    for (const subject of classSubjects) {
      // Get required periods per week for this subject
      const periodsRequired = subject.periodsPerWeek || 1;
      
      // Find teachers who can teach this subject
      const eligibleTeachers = teachers.filter(teacher => 
        teacher.subjects && teacher.subjects.some(subjectId => 
          subjectId.toString() === (subject._id || subject.id).toString()
        )
      );
      
      if (eligibleTeachers.length === 0) {
        console.warn(`No teachers available for subject ${subject.name} (${subject.code})`);
        continue;
      }
      
      // Shuffle teachers to distribute workload evenly
      const shuffledTeachers = shuffleArray(eligibleTeachers);
      
      // Try to schedule required lessons
      let periodsScheduled = 0;
      let attempts = 0;
      
      while (periodsScheduled < periodsRequired && attempts < maxAttemptsPerSubject) {
        attempts++;
        
        // Try each working day in random order
        const shuffledDays = shuffleArray(workingDays);
        
        for (const day of shuffledDays) {
          if (periodsScheduled >= periodsRequired) break;
          
          // Try each time slot in random order
          const shuffledTimeSlots = shuffleArray(teachingSlots);
          
          for (const timeSlot of shuffledTimeSlots) {
            if (periodsScheduled >= periodsRequired) break;
            
            // Check if class already has a lesson at this time
            if (isClassBusy(classId, day, timeSlot._id || timeSlot.id, lessons)) {
              continue;
            }
            
            // Try each teacher in order
            let lessonCreated = false;
            
            for (const teacher of shuffledTeachers) {
              const teacherId = teacher._id || teacher.id;
              
              // Skip if teacher is already teaching at this time
              if (isTeacherBusy(teacherId, day, timeSlot._id || timeSlot.id, lessons)) {
                continue;
              }
              
              // Find suitable classroom
              const classroom = findSuitableClassroom(
                subject, 
                classrooms, 
                day, 
                timeSlot._id || timeSlot.id, 
                lessons
              );
              
              // Create lesson
              const newLesson = {
                day,
                timeSlotId: timeSlot._id || timeSlot.id,
                classId: classId,
                subjectId: subject._id || subject.id,
                teacherId: teacherId,
                classroomId: classroom ? classroom._id || classroom.id : null
              };
              
              lessons.push(newLesson);
              periodsScheduled++;
              lessonCreated = true;
              break; // Successfully created a lesson, move to next time slot
            }
            
            if (lessonCreated) break; // Move to next day
          }
        }
      }
      
      if (periodsScheduled < periodsRequired) {
        console.warn(`Could only schedule ${periodsScheduled}/${periodsRequired} periods for ${subject.name} (${subject.code}) in class ${cls.name}`);
      }
    }
  }
  
  return lessons;
};
