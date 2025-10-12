import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Timetable, Lesson } from '@/types';
import { TimetableService } from '@/services/timetableService';

interface UseTimetableSyncProps {
  timetable: Timetable | null;
  onTimetableUpdate: (timetable: Timetable) => void;
  onLessonUpdate: (lesson: Lesson) => void;
  onLessonDelete: (lessonId: string) => void;
  onLessonAdd: (lesson: Lesson) => void;
}

export const useTimetableSync = ({
  timetable,
  onTimetableUpdate,
  onLessonUpdate,
  onLessonDelete,
  onLessonAdd,
}: UseTimetableSyncProps) => {
  const subscriptionRef = useRef<any>(null);
  const lessonSubscriptionRef = useRef<any>(null);

  // Refresh timetable data from server
  const refreshTimetable = useCallback(async () => {
    try {
      const updatedTimetable = await TimetableService.getTimetable();
      if (updatedTimetable) {
        console.log('Refreshing timetable with updated data:', updatedTimetable);
        onTimetableUpdate(updatedTimetable);
      }
    } catch (error) {
      console.error('Error refreshing timetable:', error);
    }
  }, [onTimetableUpdate]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!timetable) return;

    // Subscribe to timetable changes
    subscriptionRef.current = supabase
      .channel('timetable-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timetables',
          filter: `id=eq.${timetable.id}`,
        },
        (payload) => {
          console.log('Timetable changed:', payload);
          refreshTimetable();
        }
      )
      .subscribe();

    // Subscribe to lesson changes
    lessonSubscriptionRef.current = supabase
      .channel('lesson-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `timetable_id=eq.${timetable.id}`,
        },
        (payload) => {
          console.log('Lesson changed:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                console.log('New lesson inserted:', payload.new);
                const newLesson = {
                  ...payload.new,
                  classId: payload.new.class_id,
                  subjectId: payload.new.subject_id,
                  teacherId: payload.new.teacher_id,
                  classroomId: payload.new.classroom_id,
                  timeSlotId: payload.new.time_slot_id,
                } as Lesson;
                onLessonAdd(newLesson);
              }
              break;
            case 'UPDATE':
              if (payload.new) {
                console.log('Lesson updated:', payload.new);
                const updatedLesson = {
                  ...payload.new,
                  classId: payload.new.class_id,
                  subjectId: payload.new.subject_id,
                  teacherId: payload.new.teacher_id,
                  classroomId: payload.new.classroom_id,
                  timeSlotId: payload.new.time_slot_id,
                } as Lesson;
                onLessonUpdate(updatedLesson);
              }
              break;
            case 'DELETE':
              if (payload.old) {
                console.log('Lesson deleted:', payload.old);
                onLessonDelete(payload.old.id);
              }
              break;
          }
          
          // Also refresh the entire timetable to ensure consistency
          setTimeout(refreshTimetable, 100);
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (lessonSubscriptionRef.current) {
        supabase.removeChannel(lessonSubscriptionRef.current);
      }
    };
  }, [timetable, refreshTimetable, onLessonUpdate, onLessonDelete, onLessonAdd]);

  // Periodic sync as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (timetable) {
        refreshTimetable();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [timetable, refreshTimetable]);

  return {
    refreshTimetable,
  };
};