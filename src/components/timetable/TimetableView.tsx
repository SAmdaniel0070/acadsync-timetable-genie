
import React from "react";
import { Class, Teacher, Subject, TimeSlot, Lesson, Timetable } from "@/types";
import { cn } from "@/lib/utils";

interface TimetableViewProps {
  timetable: Timetable;
  classes: Class[];
  teachers: Teacher[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  view: "master" | "teacher" | "class";
  teacherId?: string;
  classId?: string;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TimetableView: React.FC<TimetableViewProps> = ({
  timetable,
  classes,
  teachers,
  subjects,
  timeSlots,
  view,
  teacherId,
  classId,
}) => {
  // Filter lessons based on view type
  const filteredLessons = React.useMemo(() => {
    if (view === "teacher" && teacherId) {
      return timetable.lessons.filter((lesson) => lesson.teacherId === teacherId);
    } else if (view === "class" && classId) {
      return timetable.lessons.filter((lesson) => lesson.classId === classId);
    }
    return timetable.lessons;
  }, [timetable.lessons, view, teacherId, classId]);

  // Filter out break slots for display
  const teachingTimeSlots = timeSlots.filter(slot => !slot.isBreak);
  const breakTimeSlots = timeSlots.filter(slot => slot.isBreak);

  // Helper functions to find related entities
  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || "Unknown Class";
  };

  const getTeacherName = (teacherId: string) => {
    return teachers.find((t) => t.id === teacherId)?.name || "Unknown Teacher";
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown Subject";
  };

  // Helper to get the color for a subject (for visual distinction)
  const getSubjectColor = (subjectId: string) => {
    // Generate a consistent color based on the subject ID
    const colorIndex = subjects.findIndex((s) => s.id === subjectId);
    const colors = [
      "bg-blue-100 border-blue-200",
      "bg-green-100 border-green-200",
      "bg-yellow-100 border-yellow-200",
      "bg-purple-100 border-purple-200",
      "bg-pink-100 border-pink-200",
      "bg-indigo-100 border-indigo-200",
      "bg-red-100 border-red-200",
      "bg-orange-100 border-orange-200",
    ];
    
    return colors[colorIndex % colors.length];
  };

  // Find a lesson for a specific day and time slot
  const getLessonFor = (day: number, timeSlotId: string, classId?: string, teacherId?: string) => {
    return filteredLessons.find(
      (lesson) =>
        lesson.day === day &&
        lesson.timeSlotId === timeSlotId &&
        (classId ? lesson.classId === classId : true) &&
        (teacherId ? lesson.teacherId === teacherId : true)
    );
  };

  // Determine what to render for a particular cell
  const renderCell = (day: number, timeSlot: TimeSlot) => {
    // If it's a break, render a break cell
    if (timeSlot.isBreak) {
      return (
        <div className="h-full min-h-20 flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
          Break
        </div>
      );
    }

    if (view === "master") {
      // For master view, show multiple classes in this time slot
      const lessonsInThisSlot = filteredLessons.filter(
        (lesson) => lesson.day === day && lesson.timeSlotId === timeSlot.id
      );

      return (
        <div className="h-full min-h-20 p-1 overflow-y-auto">
          {lessonsInThisSlot.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              No classes
            </div>
          ) : (
            <div className="space-y-1">
              {lessonsInThisSlot.map((lesson) => (
                <div
                  key={lesson.id}
                  className={cn(
                    "p-1 border rounded text-xs",
                    getSubjectColor(lesson.subjectId)
                  )}
                >
                  <div className="font-medium">{getClassName(lesson.classId)}</div>
                  <div>{getSubjectName(lesson.subjectId)}</div>
                  <div className="text-xs text-gray-500">
                    {getTeacherName(lesson.teacherId)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      // For teacher or class view
      const lesson = getLessonFor(
        day,
        timeSlot.id,
        view === "class" ? classId : undefined,
        view === "teacher" ? teacherId : undefined
      );

      if (!lesson) {
        return (
          <div className="h-full min-h-20 flex items-center justify-center text-gray-400 text-xs">
            Free
          </div>
        );
      }

      return (
        <div
          className={cn(
            "h-full min-h-20 p-2 flex flex-col",
            getSubjectColor(lesson.subjectId)
          )}
        >
          <div className="font-medium">{getSubjectName(lesson.subjectId)}</div>
          {view === "teacher" && (
            <div className="text-xs">{getClassName(lesson.classId)}</div>
          )}
          {view === "class" && (
            <div className="text-xs">{getTeacherName(lesson.teacherId)}</div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-md shadow overflow-auto">
      <div className="min-w-[768px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 w-24"></th>
              {daysOfWeek.map((day) => (
                <th key={day} className="border p-2 bg-gray-50">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teachingTimeSlots.map((timeSlot, index) => {
              // Find any break that should appear after this time slot
              const nextBreak = breakTimeSlots.find(
                b => b.startTime === timeSlot.endTime
              );
              
              return (
                <React.Fragment key={timeSlot.id}>
                  <tr>
                    <td className="border p-2 bg-gray-50 text-sm font-medium">
                      {timeSlot.startTime} - {timeSlot.endTime}
                    </td>
                    {daysOfWeek.map((_, dayIndex) => (
                      <td key={`${timeSlot.id}-${dayIndex}`} className="border">
                        {renderCell(dayIndex, timeSlot)}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Render break row if there's a break after this slot */}
                  {nextBreak && (
                    <tr className="bg-gray-50">
                      <td className="border p-2 text-sm font-medium">
                        {nextBreak.startTime} - {nextBreak.endTime}
                      </td>
                      {daysOfWeek.map((_, dayIndex) => (
                        <td key={`break-${nextBreak.id}-${dayIndex}`} className="border">
                          {renderCell(dayIndex, nextBreak)}
                        </td>
                      ))}
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
