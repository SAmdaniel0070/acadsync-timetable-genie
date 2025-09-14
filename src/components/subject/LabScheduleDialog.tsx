import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { LabSchedule, Teacher, Classroom, TimeSlot, Class, Batch } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LabScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  teachers: Teacher[];
  classrooms: Classroom[];
  timeSlots: TimeSlot[];
  classes: Class[];
  batches: Batch[];
  labSchedules: LabSchedule[];
  onLabSchedulesChange: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const LabScheduleDialog = ({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  teachers,
  classrooms,
  timeSlots,
  classes,
  batches,
  labSchedules,
  onLabSchedulesChange,
}: LabScheduleDialogProps) => {
  const { toast } = useToast();
  const [newSchedule, setNewSchedule] = React.useState({
    teacher_id: "",
    classroom_id: "",
    time_slot_id: "",
    day: 0,
    class_id: "",
  });

  const labClassrooms = classrooms.filter(classroom => classroom.is_lab || classroom.isLab);

  const handleAddSchedule = async () => {
    if (!newSchedule.teacher_id || !newSchedule.classroom_id || !newSchedule.time_slot_id || !newSchedule.class_id) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if there's already a lab schedule for this class on this day
      const existingSchedule = labSchedules.find(
        schedule =>
          schedule.class_id === newSchedule.class_id &&
          schedule.day === newSchedule.day
      );

      if (existingSchedule) {
        toast({
          title: "Error", 
          description: "This class already has a lab scheduled on this day",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('lab_schedules')
        .insert({
          subject_id: subjectId,
          teacher_id: newSchedule.teacher_id,
          classroom_id: newSchedule.classroom_id,
          time_slot_id: newSchedule.time_slot_id,
          day: newSchedule.day,
          class_id: newSchedule.class_id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lab schedule added successfully",
      });

      setNewSchedule({
        teacher_id: "",
        classroom_id: "",
        time_slot_id: "",
        day: 0,
        class_id: "",
      });

      onLabSchedulesChange();
    } catch (error) {
      console.error("Error adding lab schedule:", error);
      toast({
        title: "Error",
        description: "Failed to add lab schedule",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('lab_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Lab schedule deleted successfully",
      });

      onLabSchedulesChange();
    } catch (error) {
      console.error("Error deleting lab schedule:", error);
      toast({
        title: "Error",
        description: "Failed to delete lab schedule",
        variant: "destructive",
      });
    }
  };

  const getTeacherName = (teacherId: string) => {
    return teachers.find(t => t.id === teacherId)?.name || "Unknown";
  };

  const getClassroomName = (classroomId: string) => {
    return classrooms.find(c => c.id === classroomId)?.name || "Unknown";
  };

  const getTimeSlotName = (timeSlotId: string) => {
    const slot = timeSlots.find(t => t.id === timeSlotId);
    return slot ? `${slot.start_time} - ${slot.end_time}` : "Unknown";
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || "Unknown";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lab Schedules - {subjectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Schedule */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium">Add New Lab Schedule</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Class *</Label>
                <Select
                  value={newSchedule.class_id}
                  onValueChange={(value) => setNewSchedule({...newSchedule, class_id: value})}
                >
                  <SelectTrigger>
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

              <div>
                <Label>Day *</Label>
                <Select
                  value={newSchedule.day.toString()}
                  onValueChange={(value) => setNewSchedule({...newSchedule, day: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Time Slot *</Label>
                <Select
                  value={newSchedule.time_slot_id}
                  onValueChange={(value) => setNewSchedule({...newSchedule, time_slot_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.start_time} - {slot.end_time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Teacher *</Label>
                <Select
                  value={newSchedule.teacher_id}
                  onValueChange={(value) => setNewSchedule({...newSchedule, teacher_id: value})}
                >
                  <SelectTrigger>
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

              <div>
                <Label>Lab Classroom *</Label>
                <Select
                  value={newSchedule.classroom_id}
                  onValueChange={(value) => setNewSchedule({...newSchedule, classroom_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {labClassrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name} (Capacity: {classroom.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleAddSchedule} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Schedules */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Lab Schedules</h3>
            {labSchedules.length === 0 ? (
              <p className="text-muted-foreground">No lab schedules configured yet.</p>
            ) : (
              <div className="grid gap-4">
                {labSchedules.map((schedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getClassName(schedule.class_id || "")}</Badge>
                        <Badge variant="outline">{DAYS[schedule.day]}</Badge>
                        <Badge variant="outline">{getTimeSlotName(schedule.time_slot_id)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Teacher: {getTeacherName(schedule.teacher_id)} | 
                        Lab: {getClassroomName(schedule.classroom_id)}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
