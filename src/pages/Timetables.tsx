import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataService } from "@/services/mockData";
import { Timetable, Class, Teacher, Subject, TimeSlot, TimetableView as TimetableViewType, EditMode, Lesson, Classroom } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { TimetableTabs } from "@/components/timetable/TimetableTabs";
import { TimetableActions } from "@/components/timetable/TimetableActions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const Timetables = () => {
  const { toast } = useToast();
  const [timetable, setTimetable] = React.useState<Timetable | null>(null);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [classrooms, setClassrooms] = React.useState<Classroom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState<TimetableViewType>("master");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<string>("");
  const [selectedClassroomId, setSelectedClassroomId] = React.useState<string>("");
  const [editMode, setEditMode] = React.useState<EditMode>("none");

  // Fetch all required data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [timetableData, classesData, teachersData, subjectsData, timeSlotsData, classroomsData] = await Promise.all([
        DataService.getTimetable(),
        DataService.getClasses(),
        DataService.getTeachers(),
        DataService.getSubjects(),
        DataService.getTimeSlots(),
        DataService.getClassrooms(),
      ]);
      
      setTimetable(timetableData);
      setClasses(classesData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setTimeSlots(timeSlotsData);
      setClassrooms(classroomsData);
      
      // Set default selections if available
      if (classesData.length > 0) setSelectedClassId(classesData[0].id);
      if (teachersData.length > 0) setSelectedTeacherId(teachersData[0].id);
      if (classroomsData.length > 0) setSelectedClassroomId(classroomsData[0].id);
      
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

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      if (!timetable) return;

      // Save the current timetable state to the database
      await DataService.updateTimetable(timetable);
      
      toast({
        title: "Success",
        description: "Timetable changes saved successfully",
      });
    } catch (error) {
      console.error("Error saving timetable:", error);
      toast({
        title: "Error",
        description: "Failed to save timetable changes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Timetables" 
        description="Generate and view timetables"
        actions={
          <Button onClick={handleSaveChanges} disabled={!timetable}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      <div className="mb-6">
        <TimetableActions
          onGenerate={handleGenerateTimetable}
          onDownload={handleDownload}
          onShareEmail={handleShareEmail}
          onShareWhatsApp={handleShareWhatsApp}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
        />
      </div>

      {timetable && (
        <TimetableTabs
          timetable={timetable}
          classes={classes}
          teachers={teachers}
          subjects={subjects}
          timeSlots={timeSlots}
          classrooms={classrooms}
          activeView={activeView}
          setActiveView={setActiveView}
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
          selectedTeacherId={selectedTeacherId}
          setSelectedTeacherId={setSelectedTeacherId}
          selectedClassroomId={selectedClassroomId}
          setSelectedClassroomId={setSelectedClassroomId}
          editMode={editMode}
          onUpdateLesson={handleUpdateLesson}
          onDeleteLesson={handleDeleteLesson}
          onAddLesson={handleAddLesson}
        />
      )}
    </div>
  );
};

export default Timetables;
