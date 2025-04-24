import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Class, Teacher, Subject, TimeSlot, Lesson, Classroom } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataService } from "@/services/mockData";

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
  onSave: (lesson: Lesson) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (lesson: Omit<Lesson, "id">) => Promise<void>;
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
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!lesson;

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const nonBreakTimeSlots = timeSlots.filter(slot => !slot.isBreak);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const data = await DataService.getClassrooms();
        setClassrooms(data);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
      }
    };

    fetchClassrooms();
  }, []);

  useEffect(() => {
    if (open) {
      if (isEditMode && lesson) {
        setSelectedClass(lesson.classId);
        setSelectedTeacher(lesson.teacherId);
        setSelectedSubject(lesson.subjectId);
        setSelectedBatch(lesson.batchId || "no-batch");
        setSelectedDay(lesson.day);
        setSelectedTimeSlot(lesson.timeSlotId);
        setSelectedClassroom(lesson.classroomId || "no-classroom");

        // Fetch batches for the selected class
        const fetchBatches = async () => {
          try {
            const data = await DataService.getBatchesByClass(lesson.classId);
            setBatches(data);
          } catch (error) {
            console.error("Error fetching batches:", error);
          }
        };
        
        fetchBatches();
      } else {
        setSelectedClass(null);
        setSelectedTeacher(null);
        setSelectedSubject(null);
        setSelectedBatch("no-batch");
        setSelectedDay(day);
        setSelectedTimeSlot(timeSlotId);
        setSelectedClassroom("no-classroom");
        setBatches([]);
      }
    }
  }, [open, lesson, isEditMode, day, timeSlotId]);

  useEffect(() => {
    if (selectedClass) {
      const fetchBatches = async () => {
        try {
          const data = await DataService.getBatchesByClass(selectedClass);
          setBatches(data);
        } catch (error) {
          console.error("Error fetching batches:", error);
        }
      };
      
      fetchBatches();
    } else {
      setBatches([]);
    }
  }, [selectedClass]);

  const handleSave = async () => {
    if (!selectedClass || !selectedTeacher || !selectedSubject || !selectedDay || !selectedTimeSlot) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && lesson) {
        const updatedLesson: Lesson = {
          ...lesson,
          classId: selectedClass,
          teacherId: selectedTeacher,
          subjectId: selectedSubject,
          day: selectedDay,
          timeSlotId: selectedTimeSlot,
          batchId: selectedBatch === "no-batch" ? undefined : selectedBatch,
          classroomId: selectedClassroom === "no-classroom" ? undefined : selectedClassroom,
        };
        
        await onSave(updatedLesson);
      } else {
        const newLesson = {
          classId: selectedClass,
          teacherId: selectedTeacher,
          subjectId: selectedSubject,
          day: selectedDay,
          timeSlotId: selectedTimeSlot,
          batchId: selectedBatch === "no-batch" ? undefined : selectedBatch,
          classroomId: selectedClassroom === "no-classroom" ? undefined : selectedClassroom,
        };
        
        await onAdd(newLesson);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving lesson:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !lesson) return;
    
    setIsSubmitting(true);
    
    try {
      await onDelete(lesson.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting lesson:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedBatch("no-batch"); // Reset batch when class changes
  };

  // Filter teachers based on selected subject
  const eligibleTeachers = selectedSubject 
    ? teachers.filter(teacher => teacher.subjects.includes(selectedSubject))
    : teachers;

  // Filter classrooms based on whether the subject is a lab subject or not
  const selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
  const isLabSubject = selectedSubjectObj && 
    (selectedSubjectObj.name.toLowerCase().includes('lab') || 
    selectedSubjectObj.code.toLowerCase().includes('lab'));
  
  const eligibleClassrooms = classrooms.filter(c => isLabSubject ? c.isLab : true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Lesson" : "Add Lesson"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="day" className="text-right">
              Day
            </Label>
            <Select value={String(selectedDay)} onValueChange={(value) => setSelectedDay(Number(value))}>
              <SelectTrigger id="day" className="col-span-3">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeSlot" className="text-right">
              Time
            </Label>
            <Select value={selectedTimeSlot || ''} onValueChange={setSelectedTimeSlot}>
              <SelectTrigger id="timeSlot" className="col-span-3">
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {nonBreakTimeSlots.map((slot) => (
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
            <Select value={selectedClass || ''} onValueChange={handleClassChange}>
              <SelectTrigger id="class" className="col-span-3">
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

          {batches.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="batch" className="text-right">
                Batch
              </Label>
              <Select value={selectedBatch || ''} onValueChange={setSelectedBatch}>
                <SelectTrigger id="batch" className="col-span-3">
                  <SelectValue placeholder="Select batch (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-batch">No Batch (Entire Class)</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Select value={selectedSubject || ''} onValueChange={setSelectedSubject}>
              <SelectTrigger id="subject" className="col-span-3">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
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
              value={selectedTeacher || ''} 
              onValueChange={setSelectedTeacher}
              disabled={eligibleTeachers.length === 0}
            >
              <SelectTrigger id="teacher" className="col-span-3">
                <SelectValue placeholder={
                  selectedSubject && eligibleTeachers.length === 0 
                    ? "No teachers for this subject" 
                    : "Select teacher"
                } />
              </SelectTrigger>
              <SelectContent>
                {eligibleTeachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="classroom" className="text-right">
              Classroom
            </Label>
            <Select value={selectedClassroom || ''} onValueChange={setSelectedClassroom}>
              <SelectTrigger id="classroom" className="col-span-3">
                <SelectValue placeholder="Select classroom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-classroom">No specific classroom</SelectItem>
                {eligibleClassrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name} ({classroom.isLab ? 'Lab' : 'Room'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          {isEditMode && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          )}
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={isSubmitting}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
