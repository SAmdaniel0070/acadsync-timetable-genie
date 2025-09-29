
import React, { useState } from "react";
import { Class, Teacher, Subject, TimeSlot, Lesson, Timetable, EditMode, Classroom } from "@/types";
import { cn } from "@/lib/utils";
import { TimetableEditDialog } from "./TimetableEditDialog";
import { ClassColorLegend, getClassColorMap } from "./ClassColorLegend";
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
    return classColorMap[classId]?.colorClass || "bg-muted border-border";
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
        <div className="h-full min-h-20 flex items-center justify-center bg-muted/50 text-muted-foreground text-xs">
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
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              {editMode === "edit" ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddLesson(day, timeSlot.id)}
                  className="text-muted-foreground hover:text-foreground"
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
                     getClassColor(lesson.classId)
                   )}
                >
                  <div className="font-medium">{getClassName(lesson.classId)}</div>
                  <div>
                    {getSubjectName(lesson.subjectId)}
                    {isSubjectLab(lesson.subjectId) && (
                      <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                        Practical
                      </span>
                    )}
                  </div>
                   <div className="text-xs text-muted-foreground">
                     {getTeacherName(lesson.teacherId)}
                   </div>
                   <div className="text-xs text-muted-foreground">
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
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
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
                 getClassColor(lesson.classId)
               )}
            >
              <div className="font-medium">
                {getSubjectName(lesson.subjectId)}
                {isSubjectLab(lesson.subjectId) && (
                  <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                    Practical
                  </span>
                )}
              </div>
              {view !== "class" && (
                <div className="text-xs">{getClassName(lesson.classId)}</div>
              )}
              {view !== "teacher" && (
                <div className="text-xs">{getTeacherName(lesson.teacherId)}</div>
              )}
              {view !== "classroom" && lesson.classroomId && (
                <div className="text-xs text-muted-foreground">{getClassroomName(lesson.classroomId)}</div>
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
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              {editMode === "edit" ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddLesson(day, timeSlot.id)}
                  className="text-muted-foreground hover:text-foreground"
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

    <div className="bg-card rounded-md shadow overflow-auto">
      <div className="min-w-[768px]">
        <table className="table-fixed w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-border p-2 bg-muted/50 text-foreground"></th>
              {daysOfWeek.map((day) => (
                <th
                  key={day}
                  className="border border-border p-2 bg-muted/50 text-foreground"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {teachingTimeSlots.map((timeSlot) => {
              const nextBreak = breakTimeSlots.find(
                (b) => b.startTime === timeSlot.endTime
              );

              return (
                <React.Fragment key={timeSlot.id}>
                  <tr>
                    <td className="border border-border p-2 bg-muted/50 text-sm font-medium text-foreground">
                      {timeSlot.startTime} – {timeSlot.endTime}
                    </td>
                    {daysOfWeek.map((_, dayIndex) => (
                      <td
                        key={`${timeSlot.id}-${dayIndex}`}
                        className="border border-border"
                      >
                        {renderCell(dayIndex, timeSlot)}
                      </td>
                    ))}
                  </tr>

                  {nextBreak && (
                    <tr className="bg-muted/50">
                      <td className="border border-border p-2 text-sm font-medium text-foreground">
                        {nextBreak.startTime} – {nextBreak.endTime}
                      </td>
                      {daysOfWeek.map((_, dayIndex) => (
                        <td
                          key={`break-${nextBreak.id}-${dayIndex}`}
                          className="border border-border"
                        >
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
