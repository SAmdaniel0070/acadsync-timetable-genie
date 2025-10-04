import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Class, Teacher, Subject, TimeSlot, Lesson, Classroom, Batch, LabSchedule } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

  const getTimeSlotInfo = (timeSlotId: string) => {
    const slot = timeSlots.find(t => t.id === timeSlotId);
    return slot ? `${slot.start_time} - ${slot.end_time}` : "Unknown";
  };

  // Get theory lessons (non-lab lessons for this class)
  const theoryLessons = lessons.filter(lesson => 
    lesson.class_id === classId &&
    !subjects.find(s => s.id === lesson.subject_id)?.isLab
  );

  // Group theory lessons by day and time
  const theoryByDayTime: Record<number, Record<string, Lesson>> = {};
  theoryLessons.forEach(lesson => {
    if (!theoryByDayTime[lesson.day]) {
      theoryByDayTime[lesson.day] = {};
    }
    theoryByDayTime[lesson.day][lesson.time_slot_id] = lesson;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Class: {selectedClass?.name || "Unknown"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {batches.length} batch{batches.length !== 1 ? 'es' : ''} found
          </p>
        </CardHeader>
      </Card>

      {/* Common Theory Lectures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Common for All Batches</Badge>
            Theory Lectures
          </CardTitle>
        </CardHeader>
        <CardContent>
          {theoryLessons.length === 0 ? (
            <p className="text-muted-foreground">No theory lectures scheduled.</p>
          ) : (
            <div className="space-y-4">
              {DAYS.map((dayName, dayIndex) => {
                const dayLessons = Object.entries(theoryByDayTime[dayIndex] || {});
                if (dayLessons.length === 0) return null;

                return (
                  <div key={dayIndex}>
                    <h4 className="font-medium mb-2">{dayName}</h4>
                    <div className="grid gap-2">
                      {dayLessons.map(([timeSlotId, lesson]) => (
                        <div 
                          key={lesson.id}
                          className="border rounded-lg p-3 bg-muted/30"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{getTimeSlotInfo(timeSlotId)}</Badge>
                                <span className="font-medium">{getSubjectName(lesson.subject_id)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Teacher: {getTeacherName(lesson.teacher_id)}
                                {lesson.classroom_id && ` | Room: ${getClassroomName(lesson.classroom_id)}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lab Schedules by Batch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="default">Batch-Specific</Badge>
            Lab Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="text-muted-foreground">No batches configured for this class.</p>
          ) : (
            <div className="space-y-6">
              {batches.map((batch) => {
                const batchLabs = labSchedules.filter(ls => 
                  ls.batch_id === batch.id || 
                  (ls.batch_id === null && ls.class_id === classId)
                );

                return (
                  <div key={batch.id} className="border rounded-lg p-4 bg-accent/10">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-lg">{batch.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Strength: {batch.strength || 'N/A'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {batchLabs.length} lab session{batchLabs.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {batchLabs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No lab sessions scheduled for this batch.</p>
                    ) : (
                      <div className="space-y-2">
                        {DAYS.map((dayName, dayIndex) => {
                          const dayLabs = batchLabs.filter(ls => ls.day === dayIndex);
                          if (dayLabs.length === 0) return null;

                          return (
                            <div key={dayIndex}>
                              <h5 className="text-sm font-medium mb-1">{dayName}</h5>
                              <div className="grid gap-2">
                                {dayLabs.map((lab) => {
                                  const subject = subjects.find(s => s.id === lab.subject_id);
                                  return (
                                    <div 
                                      key={lab.id}
                                      className="border rounded-md p-2 bg-background"
                                    >
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs">
                                          {getTimeSlotInfo(lab.time_slot_id)}
                                        </Badge>
                                        <span className="font-medium text-sm">
                                          {subject?.name || "Unknown"} Lab
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Teacher: {getTeacherName(lab.teacher_id)} | 
                                        Lab: {getClassroomName(lab.classroom_id)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};