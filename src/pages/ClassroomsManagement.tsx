import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { TimetableService } from "@/services/timetableService";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash, Building, Users, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Classroom, Class, Teacher, Subject, TimeSlot } from "@/types";

const ClassroomsManagement = () => {
  const { toast } = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isLabScheduleDialogOpen, setIsLabScheduleDialogOpen] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState<Classroom | null>(null);
  const [classroomAssignments, setClassroomAssignments] = useState<any[]>([]);
  const [labSchedules, setLabSchedules] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    capacity: 30,
    isLab: false,
  });

  const [assignmentData, setAssignmentData] = useState({
    classId: "",
    classroomId: "",
  });

  const [labScheduleData, setLabScheduleData] = useState({
    classroomId: "",
    teacherId: "",
    subjectId: "",
    timeSlotId: "",
    day: 0,
    classId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classroomsData, classesData, teachersData, subjectsData, timeSlotsData] = await Promise.all([
        TimetableService.getClassrooms(),
        TimetableService.getClasses(),
        TimetableService.getTeachers(),
        TimetableService.getSubjects(),
        TimetableService.getTimeSlots(),
      ]);
      
      setClassrooms(classroomsData);
      setClasses(classesData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setTimeSlots(timeSlotsData);

      // Fetch classroom assignments
      const { data: assignments } = await supabase
        .from('class_classroom_assignments')
        .select(`
          *,
          classes:class_id(name),
          classrooms:classroom_id(name)
        `);
      setClassroomAssignments(assignments || []);

      // Fetch lab schedules
      const { data: schedules } = await supabase
        .from('lab_schedules')
        .select(`
          *,
          classrooms:classroom_id(name, is_lab),
          teachers:teacher_id(name),
          subjects:subject_id(name),
          time_slots:time_slot_id(start_time, end_time),
          classes:class_id(name)
        `);
      setLabSchedules(schedules || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'capacity' ? parseInt(value) : value });
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, isLab: checked });
  };

  const handleAddClassroom = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Classroom name is required.",
          variant: "destructive",
        });
        return;
      }

      if (currentClassroom) {
        // Update existing classroom
        const { error } = await supabase
          .from('classrooms')
          .update({
            name: formData.name,
            capacity: formData.capacity,
            is_lab: formData.isLab,
          })
          .eq('id', currentClassroom.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Classroom updated successfully.",
        });
      } else {
        // Add new classroom
        const { error } = await supabase
          .from('classrooms')
          .insert({
            name: formData.name,
            capacity: formData.capacity,
            is_lab: formData.isLab,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Classroom added successfully.",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving classroom:", error);
      toast({
        title: "Error",
        description: "Failed to save classroom.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClassroom = async (classroom: Classroom) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', classroom.id);
      
      if (error) throw error;
      await fetchData();
      
      toast({
        title: "Success",
        description: "Classroom deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting classroom:", error);
      toast({
        title: "Error",
        description: "Failed to delete classroom.",
        variant: "destructive",
      });
    }
  };

  const handleAssignClass = async () => {
    try {
      if (!assignmentData.classId || !assignmentData.classroomId) {
        toast({
          title: "Error",
          description: "Please select both class and classroom.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('class_classroom_assignments')
        .insert({
          class_id: assignmentData.classId,
          classroom_id: assignmentData.classroomId,
        });

      if (error) throw error;
      
      setIsAssignmentDialogOpen(false);
      setAssignmentData({ classId: "", classroomId: "" });
      await fetchData();
      
      toast({
        title: "Success",
        description: "Class assigned to classroom successfully.",
      });
    } catch (error) {
      console.error("Error assigning class:", error);
      toast({
        title: "Error",
        description: "Failed to assign class to classroom.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleLab = async () => {
    try {
      if (!labScheduleData.classroomId || !labScheduleData.teacherId || !labScheduleData.subjectId || !labScheduleData.timeSlotId) {
        toast({
          title: "Error",
          description: "Please fill all required fields.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('lab_schedules')
        .insert({
          classroom_id: labScheduleData.classroomId,
          teacher_id: labScheduleData.teacherId,
          subject_id: labScheduleData.subjectId,
          time_slot_id: labScheduleData.timeSlotId,
          day: labScheduleData.day,
          class_id: labScheduleData.classId || null,
        });

      if (error) throw error;
      
      setIsLabScheduleDialogOpen(false);
      setLabScheduleData({ classroomId: "", teacherId: "", subjectId: "", timeSlotId: "", day: 0, classId: "" });
      await fetchData();
      
      toast({
        title: "Success",
        description: "Lab schedule created successfully.",
      });
    } catch (error) {
      console.error("Error scheduling lab:", error);
      toast({
        title: "Error",
        description: "Failed to schedule lab.",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (classroom: Classroom) => {
    setCurrentClassroom(classroom);
    setFormData({
      name: classroom.name,
      capacity: classroom.capacity,
      isLab: classroom.is_lab || false,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentClassroom(null);
    setFormData({
      name: "",
      capacity: 30,
      isLab: false,
    });
  };

  const getDayName = (day: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
  };

  const classroomColumns = [
    { 
      key: "name", 
      title: "Name",
      render: (classroom: Classroom) => <span>{classroom.name}</span>
    },
    { 
      key: "capacity", 
      title: "Capacity",
      render: (classroom: Classroom) => <span>{classroom.capacity} students</span>
    },
    { 
      key: "type", 
      title: "Type",
      render: (classroom: Classroom) => (
        <Badge variant={classroom.is_lab ? "default" : "outline"}>
          {classroom.is_lab ? "Laboratory" : "Classroom"}
        </Badge>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (classroom: Classroom) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(classroom);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClassroom(classroom);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const assignmentColumns = [
    { 
      key: "class", 
      title: "Class",
      render: (assignment: any) => <span>{assignment.classes?.name}</span>
    },
    { 
      key: "classroom", 
      title: "Classroom",
      render: (assignment: any) => <span>{assignment.classrooms?.name}</span>
    },
    {
      key: "actions",
      title: "Actions",
      render: (assignment: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const { error } = await supabase
              .from('class_classroom_assignments')
              .delete()
              .eq('id', assignment.id);
            if (!error) {
              await fetchData();
              toast({ title: "Success", description: "Assignment removed successfully." });
            }
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const labScheduleColumns = [
    { 
      key: "lab", 
      title: "Lab",
      render: (schedule: any) => <span>{schedule.classrooms?.name}</span>
    },
    { 
      key: "teacher", 
      title: "Teacher",
      render: (schedule: any) => <span>{schedule.teachers?.name}</span>
    },
    { 
      key: "subject", 
      title: "Subject",
      render: (schedule: any) => <span>{schedule.subjects?.name}</span>
    },
    { 
      key: "time", 
      title: "Time",
      render: (schedule: any) => (
        <span>{schedule.time_slots?.start_time} - {schedule.time_slots?.end_time}</span>
      )
    },
    { 
      key: "day", 
      title: "Day",
      render: (schedule: any) => <span>{getDayName(schedule.day)}</span>
    },
    { 
      key: "class", 
      title: "Class",
      render: (schedule: any) => <span>{schedule.classes?.name || 'N/A'}</span>
    },
    {
      key: "actions",
      title: "Actions",
      render: (schedule: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const { error } = await supabase
              .from('lab_schedules')
              .delete()
              .eq('id', schedule.id);
            if (!error) {
              await fetchData();
              toast({ title: "Success", description: "Lab schedule removed successfully." });
            }
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Classroom Management"
        description="Manage classrooms, class assignments, and lab schedules"
        actions={
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Classroom
          </Button>
        }
      />

      <Tabs defaultValue="classrooms" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="assignments">Class Assignments</TabsTrigger>
          <TabsTrigger value="lab-schedules">Lab Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="classrooms">
          <DataTable
            data={classrooms}
            columns={classroomColumns}
            isLoading={loading}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Class-Classroom Assignments</h3>
              <Button onClick={() => setIsAssignmentDialogOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Assign Class
              </Button>
            </div>
            <DataTable
              data={classroomAssignments}
              columns={assignmentColumns}
              isLoading={loading}
            />
          </div>
        </TabsContent>

        <TabsContent value="lab-schedules">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Laboratory Schedules</h3>
              <Button onClick={() => setIsLabScheduleDialogOpen(true)}>
                <Clock className="mr-2 h-4 w-4" />
                Schedule Lab
              </Button>
            </div>
            <DataTable
              data={labSchedules}
              columns={labScheduleColumns}
              isLoading={loading}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Classroom Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentClassroom ? "Edit Classroom" : "Add New Classroom"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Room 101"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                min="1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="isLab" 
                checked={formData.isLab}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="isLab">This is a laboratory</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClassroom}>
              {currentClassroom ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Class to Classroom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Class *</Label>
              <Select value={assignmentData.classId} onValueChange={(value) => 
                setAssignmentData({...assignmentData, classId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
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
            <div className="grid gap-2">
              <Label>Classroom *</Label>
              <Select value={assignmentData.classroomId} onValueChange={(value) => 
                setAssignmentData({...assignmentData, classroomId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name} ({classroom.capacity} capacity)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignClass}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lab Schedule Dialog */}
      <Dialog open={isLabScheduleDialogOpen} onOpenChange={setIsLabScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Laboratory Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Laboratory *</Label>
              <Select value={labScheduleData.classroomId} onValueChange={(value) => 
                setLabScheduleData({...labScheduleData, classroomId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a laboratory" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.filter(c => c.is_lab).map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Teacher *</Label>
              <Select value={labScheduleData.teacherId} onValueChange={(value) => 
                setLabScheduleData({...labScheduleData, teacherId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
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
            <div className="grid gap-2">
              <Label>Subject *</Label>
              <Select value={labScheduleData.subjectId} onValueChange={(value) => 
                setLabScheduleData({...labScheduleData, subjectId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
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
            <div className="grid gap-2">
              <Label>Time Slot *</Label>
              <Select value={labScheduleData.timeSlotId} onValueChange={(value) => 
                setLabScheduleData({...labScheduleData, timeSlotId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time slot" />
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
            <div className="grid gap-2">
              <Label>Day *</Label>
              <Select value={labScheduleData.day.toString()} onValueChange={(value) => 
                setLabScheduleData({...labScheduleData, day: parseInt(value)})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Class (Optional)</Label>
              <Select value={labScheduleData.classId} onValueChange={(value) => 
                setLabScheduleData({...labScheduleData, classId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class (optional)" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleLab}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassroomsManagement;