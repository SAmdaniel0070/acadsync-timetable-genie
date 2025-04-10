
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Teacher, Subject, Class, Lesson, TimeSlot } from "@/types";

interface TimetableEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  day: number;
  timeSlotId: string;
  teachers: Teacher[];
  subjects: Subject[];
  classes: Class[];
  timeSlots: TimeSlot[];
  onSave: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onAdd: (lesson: Omit<Lesson, "id">) => void;
}

export const TimetableEditDialog: React.FC<TimetableEditDialogProps> = ({
  open,
  onOpenChange,
  lesson,
  day,
  timeSlotId,
  teachers,
  subjects,
  classes,
  timeSlots,
  onSave,
  onDelete,
  onAdd,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(0);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const isNewLesson = !lesson;

  // Initialize form data when lesson changes
  useEffect(() => {
    if (lesson) {
      setSelectedTeacherId(lesson.teacherId);
      setSelectedSubjectId(lesson.subjectId);
      setSelectedClassId(lesson.classId);
      setSelectedTimeSlotId(lesson.timeSlotId);
      setSelectedDay(lesson.day);
    } else {
      // Default values for a new lesson
      setSelectedTeacherId(teachers.length > 0 ? teachers[0].id : "");
      setSelectedSubjectId(subjects.length > 0 ? subjects[0].id : "");
      setSelectedClassId(classes.length > 0 ? classes[0].id : "");
      setSelectedTimeSlotId(timeSlotId);
      setSelectedDay(day);
    }
  }, [lesson, teachers, subjects, classes, day, timeSlotId]);

  // Filter subjects based on selected teacher
  const availableSubjects = selectedTeacherId
    ? subjects.filter(subject => {
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        return teacher?.subjects.includes(subject.id);
      })
    : subjects;

  const handleSave = () => {
    if (isNewLesson) {
      onAdd({
        teacherId: selectedTeacherId,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        day: selectedDay,
        timeSlotId: selectedTimeSlotId,
      });
    } else if (lesson) {
      onSave({
        ...lesson,
        teacherId: selectedTeacherId,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        day: selectedDay,
        timeSlotId: selectedTimeSlotId,
      });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (lesson) {
      onDelete(lesson.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isNewLesson ? "Add New Lesson" : "Edit Lesson"}
          </DialogTitle>
          <DialogDescription>
            {isNewLesson
              ? "Add a new lesson to the timetable"
              : "Make changes to the existing lesson"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="day" className="text-right">
              Day
            </Label>
            <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day, index) => (
                  <SelectItem key={day} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeSlot" className="text-right">
              Time Slot
            </Label>
            <Select 
              value={selectedTimeSlotId} 
              onValueChange={setSelectedTimeSlotId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots
                  .filter(slot => !slot.isBreak)
                  .map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="class" className="text-right">
              Class
            </Label>
            <Select 
              value={selectedClassId} 
              onValueChange={setSelectedClassId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacher" className="text-right">
              Teacher
            </Label>
            <Select 
              value={selectedTeacherId} 
              onValueChange={setSelectedTeacherId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Select 
              value={selectedSubjectId} 
              onValueChange={setSelectedSubjectId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          {!isNewLesson && (
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isNewLesson ? "Add" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
