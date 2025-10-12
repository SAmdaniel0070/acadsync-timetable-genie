
import React, { useState } from "react";
import { Class, Teacher, Subject, TimeSlot, Lesson, Timetable, EditMode, Classroom } from "@/types";
import { cn } from "@/lib/utils";
import { TimetableEditDialog } from "./TimetableEditDialog";
import { ClassColorLegend, getClassColorMap } from "./ClassColorLegend";
import { Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimetableService } from "@/services/timetableService";
import { 
  isSlotOccupiedByPreviousLesson, 
  isLessonMultiHour, 
  getMultiHourLessonStyle,
  formatLessonDuration 
} from "@/utils/timetableUtils";

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
    if (!timetable || !timetable.lessons || timetable.lessons.length === 0) {
      console.log('No lessons found in timetable:', timetable);
      return [];
    }
    
    console.log('Filtering lessons for view:', view, 'Total lessons:', timetable.lessons.length);
    console.log('Available lessons:', timetable.lessons);
    
    if (view === "teacher" && teacherId) {
      const filtered = timetable.lessons.filter((lesson) => lesson.teacherId === teacherId);
      console.log('Filtered teacher lessons:', filtered);
      return filtered;
    } else if (view === "class" && classId) {
      const filtered = timetable.lessons.filter((lesson) => lesson.classId === classId);
      console.log('Filtered class lessons:', filtered);
      return filtered;
    } else if (view === "classroom" && classroomId) {
      const filtered = timetable.lessons.filter((lesson) => lesson.classroomId === classroomId);
      console.log('Filtered classroom lessons:', filtered);
      return filtered;
    }
    console.log('Returning all lessons for master view:', timetable.lessons);
    return timetable.lessons;
  }, [timetable, view, teacherId, classId, classroomId]);

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

  const isSubjectLab = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.isLab || false;
  };

  const getClassroomName = (classroomId?: string) => {
    if (!classroomId) return "No Room";
    return classrooms.find((c) => c.id === classroomId)?.name || "Unknown Room";
  };

  // Get class color mapping
  const classColorMap = React.useMemo(() => getClassColorMap(classes), [classes]);

  // Helper to get the color for a class (for visual distinction)
  const getClassColor = (classId: string) => {
    return classColorMap[classId]?.colorClass || "bg-gray-100 border-gray-200";
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

  // Check if a time slot is occupied by a multi-slot lesson from previous slot
  const checkSlotOccupiedByPrevious = (day: number, timeSlotId: string, classId?: string, teacherId?: string, classroomId?: string) => {
    return isSlotOccupiedByPreviousLesson(
      day,
      timeSlotId,
      filteredLessons,
      subjects,
      teachingTimeSlots,
      { classId, teacherId, classroomId }
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
        <div className="h-full min-h-20 flex items-center justify-center timetable-break text-sm font-medium">
          Break
        </div>
      );
    }

    if (view === "master") {
      // For master view, show multiple classes in this time slot
      const lessonsInThisSlot = filteredLessons.filter(
        (lesson) => lesson.day === day && lesson.timeSlotId === timeSlot.id
      );

      // Check if this slot is occupied by a previous 2-hour lesson
      const occupyingLesson = checkSlotOccupiedByPrevious(day, timeSlot.id);
      const occupyingLessons = occupyingLesson ? [occupyingLesson] : [];

      return (
        <div className="h-full min-h-20 p-1 overflow-y-auto">
          {lessonsInThisSlot.length === 0 && occupyingLessons.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              {editMode === "edit" ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddLesson(day, timeSlot.id)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
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
              {/* Render regular lessons in this slot */}
              {lessonsInThisSlot.map((lesson) => {
                const styleInfo = getMultiHourLessonStyle(lesson, subjects);
                
                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      "timetable-lesson p-2 text-xs relative group",
                      getClassColor(lesson.classId),
                      styleInfo.borderStyle,
                      styleInfo.isMultiHour && "timetable-lesson-lab"
                    )}
                  >
                    <div className="font-semibold text-sm mb-1">{getClassName(lesson.classId)}</div>
                    <div className="mb-1">
                      {getSubjectName(lesson.subjectId)}
                      {isSubjectLab(lesson.subjectId) && (
                        <span className="ml-1 px-2 py-0.5 badge-lab text-xs rounded-full font-medium">
                          {formatLessonDuration(lesson, subjects) || "Lab"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      👨‍🏫 {getTeacherName(lesson.teacherId)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      🏛️ {getClassroomName(lesson.classroomId)}
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
                );
              })}
              
              {/* Render continuation of 2-hour lessons from previous slot */}
              {occupyingLessons.map((lesson) => (
                <div
                  key={`continuation-${lesson.id}`}
                  className={cn(
                    "timetable-lesson timetable-lesson-continuation p-2 text-xs relative group",
                    getClassColor(lesson.classId || lesson.class_id),
                    "border-l-4 border-l-orange-500"
                  )}
                >
                  <div className="font-semibold text-sm mb-1 text-orange-700 dark:text-orange-300">
                    {getClassName(lesson.classId || lesson.class_id)} (cont.)
                  </div>
                  <div className="text-orange-600 dark:text-orange-400 mb-1">
                    {getSubjectName(lesson.subjectId || lesson.subject_id)}
                    <span className="ml-1 px-2 py-0.5 bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 text-xs rounded-full font-medium">
                      2h Lab - Slot 2
                    </span>
                  </div>
                  <div className="text-xs text-orange-500 dark:text-orange-400 mb-1">
                    👨‍🏫 {getTeacherName(lesson.teacherId || lesson.teacher_id)}
                  </div>
                  <div className="text-xs text-orange-500 dark:text-orange-400">
                    🏛️ {getClassroomName(lesson.classroomId || lesson.classroom_id)}
                  </div>
                </div>
              ))}
              
              {editMode === "edit" && lessonsInThisSlot.length === 0 && occupyingLessons.length === 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddLesson(day, timeSlot.id)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
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

      // Check if this slot is occupied by a previous 2-hour lesson
      const occupyingLesson = checkSlotOccupiedByPrevious(
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
                "timetable-lesson h-full p-3 flex flex-col group",
                getClassColor(lesson.classId),
                isSubjectLab(lesson.subjectId) && "timetable-lesson-lab"
              )}
            >
              <div className="font-semibold text-sm mb-2">
                {getSubjectName(lesson.subjectId)}
                {isSubjectLab(lesson.subjectId) && (
                  <span className="ml-2 px-2 py-0.5 badge-lab text-xs rounded-full font-medium">
                    {formatLessonDuration(lesson, subjects) || "Lab"}
                  </span>
                )}
              </div>
              {view !== "class" && (
                <div className="text-sm text-muted-foreground mb-1">🎓 {getClassName(lesson.classId)}</div>
              )}
              {view !== "teacher" && (
                <div className="text-sm text-muted-foreground mb-1">👨‍🏫 {getTeacherName(lesson.teacherId)}</div>
              )}
              {view !== "classroom" && lesson.classroomId && (
                <div className="text-sm text-muted-foreground">🏛️ {getClassroomName(lesson.classroomId)}</div>
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
          ) : occupyingLesson ? (
            <div
              className={cn(
                "timetable-lesson timetable-lesson-continuation h-full p-3 flex flex-col border-dashed",
                getClassColor(occupyingLesson.classId),
                "border-l-4 border-l-orange-500"
              )}
            >
              <div className="font-semibold text-sm mb-2 text-orange-700 dark:text-orange-300">
                {getSubjectName(occupyingLesson.subjectId)} (cont.)
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400 mb-2">
                <span className="px-2 py-0.5 bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 text-xs rounded-full font-medium">
                  2h Lab - Slot 2
                </span>
              </div>
              {view !== "class" && (
                <div className="text-sm text-orange-500 dark:text-orange-400 mb-1">🎓 {getClassName(occupyingLesson.classId)}</div>
              )}
              {view !== "teacher" && (
                <div className="text-sm text-orange-500 dark:text-orange-400 mb-1">👨‍🏫 {getTeacherName(occupyingLesson.teacherId)}</div>
              )}
              {view !== "classroom" && occupyingLesson.classroomId && (
                <div className="text-sm text-orange-500 dark:text-orange-400">🏛️ {getClassroomName(occupyingLesson.classroomId)}</div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              {editMode === "edit" ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddLesson(day, timeSlot.id)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
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
      {/* Show color legend only for master view */}
      {view === "master" && <ClassColorLegend classes={classes} />}
      
      <div className="bg-card rounded-md shadow-sm border border-border overflow-auto">
        <div className="min-w-[768px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header border border-border p-3 w-24 text-sm font-semibold"></th>
                {daysOfWeek.map((day) => (
                  <th key={day} className="table-header border border-border p-3 text-sm font-semibold">
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
                      <td className="table-header border border-border p-3 text-sm font-semibold">
                        {timeSlot.startTime} - {timeSlot.endTime}
                      </td>
                      {daysOfWeek.map((_, dayIndex) => (
                        <td key={`${timeSlot.id}-${dayIndex}`} className="table-cell border border-border">
                          {renderCell(dayIndex, timeSlot)}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Render break row if there's a break after this slot */}
                    {nextBreak && (
                      <tr className="timetable-break">
                        <td className="table-header border border-border p-3 text-sm font-semibold">
                          {nextBreak.startTime} - {nextBreak.endTime}
                        </td>
                        {daysOfWeek.map((_, dayIndex) => (
                          <td key={`break-${nextBreak.id}-${dayIndex}`} className="table-cell border border-border timetable-break">
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
          timetable={timetable}
          onSave={handleSaveLesson}
          onDelete={handleDeleteLesson}
          onAdd={handleAddNewLesson}
        />
      )}
    </>
  );
};
