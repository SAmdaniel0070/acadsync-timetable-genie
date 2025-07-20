
import React, { useState } from "react";
import { Class, Teacher, Subject, TimeSlot, Lesson, Timetable, EditMode, Classroom } from "@/types";
import { cn } from "@/lib/utils";
import { TimetableEditDialog } from "./TimetableEditDialog";
import { Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimetableService } from "@/services/timetableService";

interface TimetableViewProps {
  timetable: Timetable;
  classes: Class[];
  teachers: Teacher[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  view: "master" | "teacher" | "class" | "classroom";
  teacherId?: string;
  classId?: string;
  classroomId?: string;
  editMode?: EditMode;
  onUpdateLesson?: (lesson: Lesson) => Promise<void>;
  onDeleteLesson?: (id: string) => Promise<void>;
  onAddLesson?: (lesson: Omit<Lesson, "id">) => Promise<void>;
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
  classroomId,
  editMode = "none",
  onUpdateLesson,
  onDeleteLesson,
  onAddLesson,
}) => {
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addingLessonAt, setAddingLessonAt] = useState<{ day: number; timeSlotId: string } | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // Fetch classrooms for displaying in lesson details
  React.useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const classroomsData = await TimetableService.getClassrooms();
        setClassrooms(classroomsData);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
      }
    };
    
    fetchClassrooms();
  }, []);

  // Filter lessons based on view type
  const filteredLessons = React.useMemo(() => {
    if (view === "teacher" && teacherId) {
      return timetable.lessons.filter((lesson) => lesson.teacherId === teacherId);
    } else if (view === "class" && classId) {
      return timetable.lessons.filter((lesson) => lesson.classId === classId);
    } else if (view === "classroom" && classroomId) {
      return timetable.lessons.filter((lesson) => lesson.classroomId === classroomId);
    }
    return timetable.lessons;
  }, [timetable.lessons, view, teacherId, classId, classroomId]);

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

  const getClassroomName = (classroomId?: string) => {
    if (!classroomId) return "No Room";
    return classrooms.find((c) => c.id === classroomId)?.name || "Unknown Room";
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
  const getLessonFor = (day: number, timeSlotId: string, classId?: string, teacherId?: string, classroomId?: string) => {
    return filteredLessons.find(
      (lesson) =>
        lesson.day === day &&
        lesson.timeSlotId === timeSlotId &&
        (classId ? lesson.classId === classId : true) &&
        (teacherId ? lesson.teacherId === teacherId : true) &&
        (classroomId ? lesson.classroomId === classroomId : true)
    );
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsDialogOpen(true);
  };

  const handleAddLesson = (day: number, timeSlotId: string) => {
    setAddingLessonAt({ day, timeSlotId });
    setEditingLesson(null);
    setIsDialogOpen(true);
  };

  const handleSaveLesson = async (updatedLesson: Lesson) => {
    if (onUpdateLesson) {
      await onUpdateLesson(updatedLesson);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (onDeleteLesson) {
      await onDeleteLesson(lessonId);
    }
  };

  const handleAddNewLesson = async (newLesson: Omit<Lesson, "id">) => {
    if (onAddLesson) {
      await onAddLesson(newLesson);
    }
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
              {editMode === "edit" ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddLesson(day, timeSlot.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              ) : (
                "No classes"
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {lessonsInThisSlot.map((lesson) => (
                <div
                  key={lesson.id}
                  className={cn(
                    "p-1 border rounded text-xs relative group",
                    getSubjectColor(lesson.subjectId)
                  )}
                >
                  <div className="font-medium">{getClassName(lesson.classId)}</div>
                  <div>{getSubjectName(lesson.subjectId)}</div>
                  <div className="text-xs text-gray-500">
                    {getTeacherName(lesson.teacherId)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getClassroomName(lesson.classroomId)}
                  </div>
                  {editMode === "edit" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLesson(lesson)}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 h-auto"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {editMode === "edit" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddLesson(day, timeSlot.id)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          )}
        </div>
      );
    } else {
      // For teacher, class, or classroom view
      const lesson = getLessonFor(
        day,
        timeSlot.id,
        view === "class" ? classId : undefined,
        view === "teacher" ? teacherId : undefined,
        view === "classroom" ? classroomId : undefined
      );

      return (
        <div className="h-full min-h-20 relative">
          {lesson ? (
            <div
              className={cn(
                "h-full p-2 flex flex-col group",
                getSubjectColor(lesson.subjectId)
              )}
            >
              <div className="font-medium">{getSubjectName(lesson.subjectId)}</div>
              {view !== "class" && (
                <div className="text-xs">{getClassName(lesson.classId)}</div>
              )}
              {view !== "teacher" && (
                <div className="text-xs">{getTeacherName(lesson.teacherId)}</div>
              )}
              {view !== "classroom" && lesson.classroomId && (
                <div className="text-xs text-gray-600">{getClassroomName(lesson.classroomId)}</div>
              )}
              {editMode === "edit" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditLesson(lesson)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 h-auto"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              {editMode === "edit" ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddLesson(day, timeSlot.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              ) : (
                "Free"
              )}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <>
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

      {/* Edit or Add Dialog */}
      {(editingLesson !== null || addingLessonAt !== null) && (
        <TimetableEditDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          lesson={editingLesson}
          day={addingLessonAt?.day ?? 0}
          timeSlotId={addingLessonAt?.timeSlotId ?? ""}
          teachers={teachers}
          subjects={subjects}
          classes={classes}
          timeSlots={timeSlots}
          onSave={handleSaveLesson}
          onDelete={handleDeleteLesson}
          onAdd={handleAddNewLesson}
        />
      )}
    </>
  );
};
