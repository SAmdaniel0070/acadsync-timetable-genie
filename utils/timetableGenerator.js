
/**
 * Timetable Generation Algorithm
 * 
 * This utility handles the complex task of generating timetables while respecting
 * various constraints and requirements.
 */

// Helper function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Check if a teacher is already assigned at a specific day and time slot
const isTeacherBusy = (teacher, day, timeSlotId, lessons) => {
  return lessons.some(lesson => 
    lesson.teacherId.toString() === teacher.toString() && 
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
  return lessons.some(lesson => 
    lesson.classroomId && 
    lesson.classroomId.toString() === classroomId.toString() && 
    lesson.day === day && 
    lesson.timeSlotId.toString() === timeSlotId.toString()
  );
};

// Check if a subject is already scheduled for this class on this day
const isSubjectScheduledForDay = (classId, subjectId, day, lessons) => {
  return lessons.some(lesson => 
    lesson.classId.toString() === classId.toString() && 
    lesson.subjectId.toString() === subjectId.toString() && 
    lesson.day === day
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

// Check if a teacher is unavailable
const isTeacherUnavailable = (teacher, day, timeSlotId) => {
  // Check if day is unavailable
  if (teacher.unavailableDays?.some(unavailableDay => unavailableDay.day === day)) {
    return true;
  }
  
  // Check if specific time slot is unavailable
  if (teacher.unavailableSlots?.some(slot => 
    slot.day === day && slot.timeSlotId.toString() === timeSlotId.toString()
  )) {
    return true;
  }
  
  return false;
};

// Find suitable classroom for a subject
const findSuitableClassroom = (subject, classId, day, timeSlotId, lessons, classrooms) => {
  // Get preferred classrooms if any
  let preferredClassrooms = subject.preferredClassrooms || [];
  
  // Filter classrooms based on subject type (lab/regular)
  let suitableClassrooms = classrooms.filter(classroom => 
    (subject.isLab ? classroom.isLab : true) && 
    !isClassroomOccupied(classroom._id, day, timeSlotId, lessons)
  );
  
  // Sort by preference first, then by appropriate capacity
  suitableClassrooms.sort((a, b) => {
    // First sort by preference
    const aIsPreferred = preferredClassrooms.some(pc => pc.toString() === a._id.toString());
    const bIsPreferred = preferredClassrooms.some(pc => pc.toString() === b._id.toString());
    
    if (aIsPreferred && !bIsPreferred) return -1;
    if (!aIsPreferred && bIsPreferred) return 1;
    
    // Then sort by capacity - choose the smallest room that fits
    return a.capacity - b.capacity;
  });
  
  return suitableClassrooms[0] || null;
};

/**
 * Generate a timetable based on the given inputs
 * 
 * @param {Object} params - The parameters for timetable generation
 * @returns {Array} Generated lessons for the timetable
 */
exports.generateTimetable = async ({
  classes,
  subjects,
  teachers,
  timing,
  classrooms
}) => {
  // Extract working days and time slots
  const workingDays = timing.workingDays;
  const timeSlots = timing.timeSlots.filter(slot => !slot.isBreak); // Exclude break periods
  
  // Store the generated lessons
  const lessons = [];
  
  // For each class, assign subjects according to their required periods per week
  for (const cls of classes) {
    // Get subjects for this class
    const classSubjects = subjects.filter(subject => 
      subject.classes.some(clsId => clsId.toString() === cls._id.toString())
    );
    
    for (const subject of classSubjects) {
      // Find teachers who can teach this subject
      const eligibleTeachers = teachers.filter(teacher => 
        teacher.subjects.some(subjectId => subjectId.toString() === subject._id.toString())
      );
      
      if (eligibleTeachers.length === 0) {
        console.warn(`No teachers available for subject ${subject.name} (${subject.code})`);
        continue;
      }
      
      // Randomize teachers to distribute workload
      const randomizedTeachers = shuffleArray([...eligibleTeachers]);
      
      // Schedule the required number of periods per week for this subject
      let periodsScheduled = 0;
      const maxDailyPeriods = subject.periodsPerDay || 1;
      const periodsRequired = subject.periodsPerWeek;
      
      // Try to distribute periods across days
      const dayAttempts = [...shuffleArray([...workingDays])];
      
      while (periodsScheduled < periodsRequired && dayAttempts.length > 0) {
        const day = dayAttempts.shift();
        
        // Check if we've already scheduled the maximum allowed periods for this subject on this day
        const subjectPeriodsToday = lessons.filter(lesson => 
          lesson.classId.toString() === cls._id.toString() && 
          lesson.subjectId.toString() === subject._id.toString() && 
          lesson.day === day
        ).length;
        
        if (subjectPeriodsToday >= maxDailyPeriods) {
          // We've reached the daily limit for this subject, try another day
          dayAttempts.push(day); // Put back at the end to try again if needed
          continue;
        }
        
        // Try to find an available time slot and teacher for this day
        const shuffledTimeSlots = shuffleArray([...timeSlots]);
        
        // Try each time slot
        for (const timeSlot of shuffledTimeSlots) {
          // Skip if the class is already busy at this time
          if (isClassBusy(cls._id, day, timeSlot._id, lessons)) {
            continue;
          }
          
          // Try each teacher
          for (const teacher of randomizedTeachers) {
            // Skip if teacher is already busy at this time
            if (isTeacherBusy(teacher._id, day, timeSlot._id, lessons)) {
              continue;
            }
            
            // Skip if teacher is unavailable
            if (isTeacherUnavailable(teacher, day, timeSlot._id)) {
              continue;
            }
            
            // Skip if teacher has reached max hours per day
            if (getTeacherDailyCount(teacher._id, day, lessons) >= teacher.maxHoursPerDay) {
              continue;
            }
            
            // Find suitable classroom
            const classroom = findSuitableClassroom(subject, cls._id, day, timeSlot._id, lessons, classrooms);
            
            // If no classroom is available, try next teacher
            if (!classroom) {
              continue;
            }
            
            // All constraints satisfied, create the lesson
            const lesson = {
              day,
              timeSlotId: timeSlot._id,
              classId: cls._id,
              subjectId: subject._id,
              teacherId: teacher._id,
              classroomId: classroom._id
            };
            
            lessons.push(lesson);
            periodsScheduled++;
            
            if (periodsScheduled >= periodsRequired) {
              break; // We've scheduled all required periods for this subject
            }
            
            break; // Break the teacher loop, move to next time slot
          }
          
          if (periodsScheduled >= periodsRequired) {
            break; // We've scheduled all required periods for this subject
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
