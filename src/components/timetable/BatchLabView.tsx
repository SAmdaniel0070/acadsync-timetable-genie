import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Class, Teacher, Subject, TimeSlot, Lesson, Classroom, Batch, LabSchedule } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface BatchLabViewProps {
  classId: string;
  classes: Class[];
  teachers: Teacher[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  classrooms: Classroom[];
  lessons: Lesson[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const BatchLabView: React.FC<BatchLabViewProps> = ({
  classId,
  classes,
  teachers,
  subjects,
  timeSlots,
  classrooms,
  lessons,
}) => {
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [labSchedules, setLabSchedules] = React.useState<LabSchedule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasBatchSpecificLabs, setHasBatchSpecificLabs] = React.useState(false);

  const selectedClass = classes.find(c => c.id === classId);

  React.useEffect(() => {
    const fetchBatchData = async () => {
      try {
        setLoading(true);
        
        // Fetch batches for this class
        const { data: batchesData, error: batchesError } = await supabase
          .from('batches')
          .select('*')
          .eq('class_id', classId)
          .order('name');

        if (batchesError) throw batchesError;

        // Fetch lab schedules for this class
        const { data: labSchedulesData, error: labError } = await supabase
          .from('lab_schedules')
          .select('*')
          .eq('class_id', classId);

        if (labError) throw labError;

        setBatches(batchesData || []);
        setLabSchedules(labSchedulesData || []);
        setHasBatchSpecificLabs((labSchedulesData || []).length > 0);
      } catch (error) {
        console.error("Error fetching batch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchBatchData();
    }
  }, [classId]);

  const getTeacherName = (teacherId: string) => {
    return teachers.find(t => t.id === teacherId)?.name || "Unknown";
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "Unknown";
  };

  const getClassroomName = (classroomId: string | null) => {
    if (!classroomId) return "TBA";
    return classrooms.find(c => c.id === classroomId)?.name || "Unknown";
  };

  // Get theory lessons (non-lab lessons for this class)
  const theoryLessons = lessons.filter(lesson => 
    lesson.class_id === classId &&
    !subjects.find(s => s.id === lesson.subject_id)?.isLab
  );

  // Get lab lessons from main timetable (class-wide)
  const labLessons = lessons.filter(lesson => 
    lesson.class_id === classId &&
    subjects.find(s => s.id === lesson.subject_id)?.isLab
  );

  // Group theory lessons by day and time
  const theoryByDayTime: Record<number, Record<string, Lesson>> = {};
  theoryLessons.forEach(lesson => {
    if (!theoryByDayTime[lesson.day]) {
      theoryByDayTime[lesson.day] = {};
    }
    theoryByDayTime[lesson.day][lesson.time_slot_id] = lesson;
  });

  // Group lab schedules by day and time (batch-specific)
  const labsByDayTime: Record<number, Record<string, LabSchedule[]>> = {};
  labSchedules.forEach(lab => {
    if (!labsByDayTime[lab.day]) {
      labsByDayTime[lab.day] = {};
    }
    if (!labsByDayTime[lab.day][lab.time_slot_id]) {
      labsByDayTime[lab.day][lab.time_slot_id] = [];
    }
    labsByDayTime[lab.day][lab.time_slot_id].push(lab);
  });

  // Group class-wide lab lessons by day and time (fallback)
  const classLabsByDayTime: Record<number, Record<string, Lesson[]>> = {};
  labLessons.forEach(lesson => {
    if (!classLabsByDayTime[lesson.day]) {
      classLabsByDayTime[lesson.day] = {};
    }
    if (!classLabsByDayTime[lesson.day][lesson.time_slot_id]) {
      classLabsByDayTime[lesson.day][lesson.time_slot_id] = [];
    }
    classLabsByDayTime[lesson.day][lesson.time_slot_id].push(lesson);
  });

  // Create batch color map
  const batchColorMap = React.useMemo(() => {
    const colorClasses = [
      "bg-red-100 border-red-200 text-red-800",
      "bg-blue-100 border-blue-200 text-blue-800", 
      "bg-green-100 border-green-200 text-green-800",
      "bg-yellow-100 border-yellow-200 text-yellow-800",
      "bg-purple-100 border-purple-200 text-purple-800",
      "bg-pink-100 border-pink-200 text-pink-800",
      "bg-indigo-100 border-indigo-200 text-indigo-800",
      "bg-orange-100 border-orange-200 text-orange-800",
      "bg-teal-100 border-teal-200 text-teal-800",
      "bg-cyan-100 border-cyan-200 text-cyan-800",
    ];

    return batches.reduce((acc, batch, index) => {
      acc[batch.id] = {
        colorClass: colorClasses[index % colorClasses.length],
        name: batch.name
      };
      return acc;
    }, {} as Record<string, { colorClass: string; name: string }>);
  }, [batches]);

  const getBatchColor = (batchId: string) => {
    return batchColorMap[batchId]?.colorClass || "bg-gray-100 border-gray-200";
  };

  // Filter teaching time slots (non-break)
  const teachingTimeSlots = timeSlots.filter(slot => !slot.is_break);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Render cell content for a specific day and time slot
  const renderCell = (dayIndex: number, timeSlot: TimeSlot) => {
    const theoryLesson = theoryByDayTime[dayIndex]?.[timeSlot.id];
    const batchLabSessions = labsByDayTime[dayIndex]?.[timeSlot.id] || [];
    const classLabSessions = classLabsByDayTime[dayIndex]?.[timeSlot.id] || [];

    const isEmpty = !theoryLesson && batchLabSessions.length === 0 && classLabSessions.length === 0;

    return (
      <div className="h-full min-h-20 p-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            Free
          </div>
        ) : (
          <div className="space-y-1">
            {/* Render theory lesson */}
            {theoryLesson && (
              <div className="p-1.5 border rounded text-xs bg-slate-100 border-slate-200">
                <div className="font-medium">{getSubjectName(theoryLesson.subject_id)}</div>
                <Badge variant="secondary" className="text-xs mt-1">
                  Common
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {getTeacherName(theoryLesson.teacher_id)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getClassroomName(theoryLesson.classroom_id)}
                </div>
              </div>
            )}

            {/* Render batch-specific lab sessions */}
            {batchLabSessions.map((lab) => {
              const batch = batches.find(b => b.id === lab.batch_id);
              return (
                <div
                  key={lab.id}
                  className={cn(
                    "p-1.5 border rounded text-xs",
                    batch ? getBatchColor(batch.id) : "bg-gray-100 border-gray-200"
                  )}
                >
                  <div className="font-medium">{getSubjectName(lab.subject_id)} Lab</div>
                  {batch && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {batch.name}
                    </Badge>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {getTeacherName(lab.teacher_id)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Lab: {getClassroomName(lab.classroom_id)}
                  </div>
                </div>
              );
            })}

            {/* Render class-wide lab lessons (fallback when no batch-specific schedules) */}
            {!hasBatchSpecificLabs && classLabSessions.map((lesson) => (
              <div
                key={lesson.id}
                className="p-1.5 border rounded text-xs bg-orange-100 border-orange-200"
              >
                <div className="font-medium">{getSubjectName(lesson.subject_id)} Lab</div>
                <Badge variant="outline" className="text-xs mt-1 bg-orange-50">
                  Class-wide Lab
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {getTeacherName(lesson.teacher_id)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Lab: {getClassroomName(lesson.classroom_id)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Class: {selectedClass?.name || "Unknown"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {batches.length} batch{batches.length !== 1 ? 'es' : ''} • 
            {theoryLessons.length} theory lecture{theoryLessons.length !== 1 ? 's' : ''} • 
            {hasBatchSpecificLabs ? labSchedules.length : labLessons.length} lab session{(hasBatchSpecificLabs ? labSchedules.length : labLessons.length) !== 1 ? 's' : ''}
          </p>
        </CardHeader>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <div className="font-medium text-blue-900">Schedule Information</div>
              <div className="text-blue-800">
                <div>Lab Scheduling: <strong>{hasBatchSpecificLabs ? 'Batch-specific' : 'Class-wide'}</strong></div>
                {!hasBatchSpecificLabs && batches.length > 0 && (
                  <div className="mt-2 text-xs text-blue-700">
                    💡 To create batch-specific lab schedules, use the Lab Schedule dialog in the Subjects page.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Color Legend */}
      {batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className="flex items-center gap-2 p-2 rounded border text-xs bg-slate-100 border-slate-200 text-slate-800">
                <div className="w-3 h-3 rounded-full bg-current opacity-60"></div>
                <span className="font-medium">Common (Theory)</span>
              </div>
              {!hasBatchSpecificLabs && (
                <div className="flex items-center gap-2 p-2 rounded border text-xs bg-orange-100 border-orange-200 text-orange-800">
                  <div className="w-3 h-3 rounded-full bg-current opacity-60"></div>
                  <span className="font-medium">Class-wide Lab</span>
                </div>
              )}
              {hasBatchSpecificLabs && Object.entries(batchColorMap).map(([batchId, { colorClass, name }]) => (
                <div
                  key={batchId}
                  className={cn("flex items-center gap-2 p-2 rounded border text-xs", colorClass)}
                >
                  <div className="w-3 h-3 rounded-full bg-current opacity-60"></div>
                  <span className="font-medium">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable Table */}
      <div className="bg-background rounded-md shadow overflow-auto">
        <div className="min-w-[768px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted w-24"></th>
                {DAYS.map((day) => (
                  <th key={day} className="border p-2 bg-muted">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachingTimeSlots.map((timeSlot) => (
                <tr key={timeSlot.id}>
                  <td className="border p-2 bg-muted text-sm font-medium">
                    {timeSlot.start_time} - {timeSlot.end_time}
                  </td>
                  {DAYS.map((_, dayIndex) => (
                    <td key={`${timeSlot.id}-${dayIndex}`} className="border">
                      {renderCell(dayIndex, timeSlot)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};