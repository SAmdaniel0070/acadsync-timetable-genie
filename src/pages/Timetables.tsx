
import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/mockData";
import { TimetableView } from "@/components/timetable/TimetableView";
import { Timetable, Class, Teacher, Subject, TimeSlot, TimetableView as TimetableViewType, EditMode, Lesson } from "@/types";
import { Download, Edit, MailIcon, Save, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Timetables = () => {
  const { toast } = useToast();
  const [timetable, setTimetable] = React.useState<Timetable | null>(null);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState<TimetableViewType>("master");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<string>("");
  const [editMode, setEditMode] = React.useState<EditMode>("none");

  // Fetch all required data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
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
      
      // Set default selections if available
      if (classesData.length > 0) setSelectedClassId(classesData[0].id);
      if (teachersData.length > 0) setSelectedTeacherId(teachersData[0].id);
      
    } catch (error) {
      console.error("Error fetching timetable data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch timetable data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateTimetable = async () => {
    try {
      setLoading(true);
      const newTimetable = await DataService.generateTimetable();
      setTimetable(newTimetable);
      toast({
        title: "Success",
        description: "Timetable generated successfully",
      });
    } catch (error) {
      console.error("Error generating timetable:", error);
      toast({
        title: "Error",
        description: "Failed to generate timetable. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    toast({
      title: "Feature Coming Soon",
      description: "WhatsApp sharing will be available in the next update.",
    });
  };

  const handleShareEmail = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Email sharing will be available in the next update.",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Timetable download will be available in the next update.",
    });
  };

  const handleUpdateLesson = async (lesson: Lesson) => {
    try {
      await DataService.updateLesson(lesson);
      const updatedTimetable = await DataService.getTimetable();
      setTimetable(updatedTimetable);
      toast({
        title: "Success",
        description: "Lesson updated successfully",
      });
    } catch (error) {
      console.error("Error updating lesson:", error);
      toast({
        title: "Error",
        description: "Failed to update lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      await DataService.deleteLesson(id);
      const updatedTimetable = await DataService.getTimetable();
      setTimetable(updatedTimetable);
      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({
        title: "Error",
        description: "Failed to delete lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddLesson = async (lesson: Omit<Lesson, "id">) => {
    try {
      await DataService.addLesson(lesson);
      const updatedTimetable = await DataService.getTimetable();
      setTimetable(updatedTimetable);
      toast({
        title: "Success",
        description: "Lesson added successfully",
      });
    } catch (error) {
      console.error("Error adding lesson:", error);
      toast({
        title: "Error",
        description: "Failed to add lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleEditMode = () => {
    setEditMode(editMode === "none" ? "edit" : "none");
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Timetables" 
        description="Generate and view timetables"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handleShareEmail}>
              <MailIcon className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" onClick={handleShareWhatsApp}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button onClick={handleGenerateTimetable}>
              Generate Timetable
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center space-x-2">
        <Switch 
          id="edit-mode" 
          checked={editMode === "edit"} 
          onCheckedChange={toggleEditMode}
        />
        <Label htmlFor="edit-mode">
          {editMode === "edit" ? (
            <span className="flex items-center text-brand-600">
              <Edit className="mr-1 h-4 w-4" />
              Editing Mode
            </span>
          ) : (
            "Enable Editing Mode"
          )}
        </Label>
      </div>

      <Tabs defaultValue="master" onValueChange={(value) => setActiveView(value as TimetableViewType)}>
        <TabsList className="mb-4">
          <TabsTrigger value="master">Master Timetable</TabsTrigger>
          <TabsTrigger value="teacher">Teacher Timetable</TabsTrigger>
          <TabsTrigger value="class">Class Timetable</TabsTrigger>
        </TabsList>

        <div className="mb-4">
          {activeView === "teacher" && (
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger className="w-full md:w-72">
                <SelectValue placeholder="Select Teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {activeView === "class" && (
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-full md:w-72">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="master" className="mt-0">
          {timetable && (
            <TimetableView
              timetable={timetable}
              classes={classes}
              teachers={teachers}
              subjects={subjects}
              timeSlots={timeSlots}
              view="master"
              editMode={editMode}
              onUpdateLesson={handleUpdateLesson}
              onDeleteLesson={handleDeleteLesson}
              onAddLesson={handleAddLesson}
            />
          )}
        </TabsContent>
        
        <TabsContent value="teacher" className="mt-0">
          {timetable && selectedTeacherId && (
            <div>
              <h3 className="text-xl font-medium mb-4">
                Timetable for {teachers.find(t => t.id === selectedTeacherId)?.name || "Selected Teacher"}
              </h3>
              <TimetableView
                timetable={timetable}
                classes={classes}
                teachers={teachers}
                subjects={subjects}
                timeSlots={timeSlots}
                view="teacher"
                teacherId={selectedTeacherId}
                editMode={editMode}
                onUpdateLesson={handleUpdateLesson}
                onDeleteLesson={handleDeleteLesson}
                onAddLesson={handleAddLesson}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="class" className="mt-0">
          {timetable && selectedClassId && (
            <div>
              <h3 className="text-xl font-medium mb-4">
                Timetable for {classes.find(c => c.id === selectedClassId)?.name || "Selected Class"}
              </h3>
              <TimetableView
                timetable={timetable}
                classes={classes}
                teachers={teachers}
                subjects={subjects}
                timeSlots={timeSlots}
                view="class"
                classId={selectedClassId}
                editMode={editMode}
                onUpdateLesson={handleUpdateLesson}
                onDeleteLesson={handleDeleteLesson}
                onAddLesson={handleAddLesson}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Timetables;
