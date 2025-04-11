
import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Classroom } from "@/types";
import { DataService } from "@/services/mockData";
import { useToast } from "@/components/ui/use-toast";
import { Plus, PenSquare, Trash2, BuildingIcon } from "lucide-react";
import { ClassroomDialog } from "@/components/classroom/ClassroomDialog";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Classrooms() {
  const { toast } = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);
  const [activeView, setActiveView] = useState("all");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");

  // Timetable related state
  const [timetable, setTimetable] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await DataService.getClassrooms();
      setClassrooms(data);
      
      if (data.length > 0) {
        setSelectedClassroomId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch classrooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetableData = async () => {
    try {
      const [timetableData, classesData, teachersData, subjectsData, timeSlotsData] = await Promise.all([
        DataService.getTimetable(),
        DataService.getClasses(),
        DataService.getTeachers(),
        DataService.getSubjects(),
        DataService.getTimeSlots(),
      ]);
      
      setTimetable(timetableData);
      setClasses(classesData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setTimeSlots(timeSlotsData);
    } catch (error) {
      console.error("Error fetching timetable data:", error);
    }
  };

  useEffect(() => {
    fetchClassrooms();
    fetchTimetableData();
  }, []);

  const handleAddClassroom = () => {
    setSelectedClassroom(null);
    setIsDialogOpen(true);
  };

  const handleEditClassroom = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setIsDialogOpen(true);
  };

  const handleSaveClassroom = async (classroom: Classroom) => {
    try {
      let updatedClassroom;
      
      if (classroom.id) {
        // Update existing classroom
        updatedClassroom = await DataService.updateClassroom(classroom);
        toast({
          title: "Success",
          description: "Classroom updated successfully",
        });
      } else {
        // Add new classroom
        updatedClassroom = await DataService.addClassroom(classroom);
        toast({
          title: "Success",
          description: "Classroom added successfully",
        });
      }
      
      await fetchClassrooms();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving classroom:", error);
      toast({
        title: "Error",
        description: "Failed to save classroom",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (classroom: Classroom) => {
    setClassroomToDelete(classroom);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!classroomToDelete) return;
    
    try {
      await DataService.deleteClassroom(classroomToDelete.id);
      await fetchClassrooms();
      toast({
        title: "Success",
        description: "Classroom deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting classroom:", error);
      toast({
        title: "Error",
        description: "Failed to delete classroom",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "name", title: "Name" },
    { 
      key: "capacity", 
      title: "Capacity",
      render: (classroom: Classroom) => (
        <span>{classroom.capacity} students</span>
      )
    },
    { 
      key: "type", 
      title: "Type",
      render: (classroom: Classroom) => (
        <Badge variant={classroom.isLab ? "default" : "outline"}>
          {classroom.isLab ? "Laboratory" : "Classroom"}
        </Badge>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (classroom: Classroom) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClassroom(classroom);
            }}
          >
            <PenSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(classroom);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Classrooms"
        description="Manage classrooms and labs"
        icon={<BuildingIcon className="h-6 w-6" />}
        actions={
          <Button onClick={handleAddClassroom}>
            <Plus className="mr-2 h-4 w-4" />
            Add Classroom
          </Button>
        }
      />

      <Tabs defaultValue="all" onValueChange={setActiveView} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Classrooms</TabsTrigger>
          <TabsTrigger value="timetable">Classroom Timetables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          <DataTable
            data={classrooms}
            columns={columns}
            isLoading={loading}
          />
        </TabsContent>
        
        <TabsContent value="timetable" className="mt-4">
          <div className="mb-4">
            <Select 
              value={selectedClassroomId} 
              onValueChange={setSelectedClassroomId}
            >
              <SelectTrigger className="w-full md:w-72">
                <SelectValue placeholder="Select Classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name} ({classroom.isLab ? 'Lab' : 'Room'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedClassroomId && timetable && (
            <div>
              <ClassroomTimetable 
                classroomId={selectedClassroomId}
                timetable={timetable}
                classes={classes}
                teachers={teachers}
                subjects={subjects}
                timeSlots={timeSlots}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Classroom Dialog */}
      <ClassroomDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        classroom={selectedClassroom}
        onSave={handleSaveClassroom}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {classroomToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ClassroomTimetableProps {
  classroomId: string;
  timetable: any;
  classes: any[];
  teachers: any[];
  subjects: any[];
  timeSlots: any[];
}

function ClassroomTimetable({
  classroomId,
  timetable,
  classes,
  teachers,
  subjects,
  timeSlots,
}: ClassroomTimetableProps) {
  const [classroomTimetable, setClassroomTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchClassroomTimetable = async () => {
      try {
        setLoading(true);
        const data = await DataService.getClassroomTimetable(classroomId);
        setClassroomTimetable(data);
      } catch (error) {
        console.error("Error fetching classroom timetable:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (classroomId) {
      fetchClassroomTimetable();
    }
  }, [classroomId]);
  
  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700"></div>
      </div>
    );
  }
  
  if (!classroomTimetable || classroomTimetable.lessons.length === 0) {
    return (
      <div className="min-h-[300px] flex items-center justify-center border rounded-md">
        <div className="text-center text-gray-500">
          <BuildingIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
          <p>No lessons scheduled for this classroom</p>
        </div>
      </div>
    );
  }
  
  // Filter out break slots for display
  const teachingTimeSlots = timeSlots.filter(slot => !slot.isBreak);
  const breakTimeSlots = timeSlots.filter(slot => slot.isBreak);
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Helper functions
  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || "Unknown Class";
  };

  const getTeacherName = (teacherId: string) => {
    return teachers.find((t) => t.id === teacherId)?.name || "Unknown Teacher";
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown Subject";
  };

  const getLessonFor = (day: number, timeSlotId: string) => {
    return classroomTimetable.lessons.find(
      (lesson: any) => lesson.day === day && lesson.timeSlotId === timeSlotId
    );
  };
  
  return (
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
                    {daysOfWeek.map((_, dayIndex) => {
                      const lesson = getLessonFor(dayIndex, timeSlot.id);
                      
                      return (
                        <td key={`${timeSlot.id}-${dayIndex}`} className="border">
                          <div className="h-full min-h-20 p-1">
                            {lesson ? (
                              <div className="h-full p-2 flex flex-col bg-blue-100 border-blue-200 border rounded">
                                <div className="font-medium">{getSubjectName(lesson.subjectId)}</div>
                                <div className="text-xs">{getClassName(lesson.classId)}</div>
                                <div className="text-xs text-gray-600">{getTeacherName(lesson.teacherId)}</div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                                Free
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  
                  {/* Render break row if there's a break after this slot */}
                  {nextBreak && (
                    <tr className="bg-gray-50">
                      <td className="border p-2 text-sm font-medium">
                        {nextBreak.startTime} - {nextBreak.endTime}
                      </td>
                      {daysOfWeek.map((_, dayIndex) => (
                        <td key={`break-${nextBreak.id}-${dayIndex}`} className="border">
                          <div className="h-full min-h-10 flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
                            Break
                          </div>
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
  );
}
