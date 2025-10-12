import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TimetableService } from "@/services/timetableService";
import { Timetable, Class, Teacher, Subject, TimeSlot, TimetableView as TimetableViewType, EditMode, Lesson, Classroom } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { TimetableTabs } from "@/components/timetable/TimetableTabs";
import { TimetableActions } from "@/components/timetable/TimetableActions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTimetableSync } from "@/hooks/useTimetableSync";
import { Save, RefreshCw } from "lucide-react";
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
  const [lastSyncTime, setLastSyncTime] = React.useState<Date>(new Date());

  // Fetch all required data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const [timetableData, classesData, teachersData, subjectsData, timeSlotsData, classroomsData] = await Promise.all([
        TimetableService.getTimetable(),
        TimetableService.getClasses(),
        TimetableService.getTeachers(),
        TimetableService.getSubjects(),
        TimetableService.getTimeSlots(),
        TimetableService.getClassrooms(),
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

  // Real-time synchronization
  const { refreshTimetable } = useTimetableSync({
    timetable,
    onTimetableUpdate: (updatedTimetable) => {
      setTimetable(updatedTimetable);
      setLastSyncTime(new Date());
      toast({
        title: "Timetable Updated",
        description: "Timetable has been synchronized with latest changes.",
      });
    },
    onLessonUpdate: (updatedLesson) => {
      if (timetable) {
        const updatedLessons = timetable.lessons.map(lesson =>
          lesson.id === updatedLesson.id ? updatedLesson : lesson
        );
        setTimetable({ ...timetable, lessons: updatedLessons });
        setLastSyncTime(new Date());
      }
    },
    onLessonDelete: (lessonId) => {
      if (timetable) {
        const updatedLessons = timetable.lessons.filter(lesson => lesson.id !== lessonId);
        setTimetable({ ...timetable, lessons: updatedLessons });
        setLastSyncTime(new Date());
      }
    },
    onLessonAdd: (newLesson) => {
      if (timetable) {
        setTimetable({ ...timetable, lessons: [...timetable.lessons, newLesson] });
        setLastSyncTime(new Date());
      }
    },
  });

  const handleGenerateTimetable = async () => {
    try {
      setLoading(true);
      const newTimetable = await TimetableService.generateTimetable();
      setTimetable(newTimetable);
      
      // Force refresh all the related data to ensure consistency
      await fetchData();
      
      toast({
        title: "Success",
        description: "Timetable generated successfully",
      });
    } catch (error) {
      console.error("Error generating timetable:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate timetable. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!timetable) {
      toast({
        title: "Error",
        description: "No timetable available to share.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const shareToken = await TimetableService.generateShareToken(timetable.id);
      const shareData = await TimetableService.shareTimetable(shareToken, 'whatsapp');
      
      // Open WhatsApp with the formatted message
      window.open(shareData.shareUrl, '_blank');
      
      toast({
        title: "Success",
        description: "Timetable shared via WhatsApp",
      });
    } catch (error) {
      console.error("Error sharing via WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to share timetable via WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareEmail = async () => {
    if (!timetable) {
      toast({
        title: "Error",
        description: "No timetable available to share.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const shareToken = await TimetableService.generateShareToken(timetable.id);
      const emailData = await TimetableService.shareTimetable(shareToken, 'email');
      
      // Open email client with formatted content
      window.location.href = emailData.mailtoUrl;
      
      toast({
        title: "Success",
        description: "Email client opened with timetable content",
      });
    } catch (error) {
      console.error("Error sharing via email:", error);
      toast({
        title: "Error",
        description: "Failed to share timetable via email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: string = 'pdf') => {
    if (!timetable) {
      toast({
        title: "Error",
        description: "No timetable available to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const blob = await TimetableService.downloadTimetable(timetable.id, format as any);
      
      // Determine file extension based on format
      const extensions: { [key: string]: string } = {
        pdf: 'pdf',
        excel: 'xlsx',
        csv: 'csv',
        html: 'html',
        json: 'json'
      };
      
      const extension = extensions[format] || 'csv';
      
      // Create a temporary link to download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timetable-${timetable.name || 'export'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Timetable downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error downloading timetable:", error);
      toast({
        title: "Error",
        description: "Failed to download timetable.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLesson = async (lesson: Lesson) => {
    try {
      // Ensure timetable_id is preserved
      const lessonWithTimetableId = {
        ...lesson,
        timetable_id: lesson.timetable_id || timetable?.id || "",
      };
      
      await TimetableService.updateLesson(lessonWithTimetableId);
      
      // Update local state immediately for better UX
      if (timetable) {
        const updatedLessons = timetable.lessons.map(l =>
          l.id === lesson.id ? lessonWithTimetableId : l
        );
        setTimetable({
          ...timetable,
          lessons: updatedLessons
        });
      }
      
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
      await TimetableService.deleteLesson(id);
      
      // Update local state immediately for better UX
      if (timetable) {
        const updatedLessons = timetable.lessons.filter(l => l.id !== id);
        setTimetable({
          ...timetable,
          lessons: updatedLessons
        });
      }
      
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
      // Ensure timetable_id is set
      const lessonWithTimetableId = {
        ...lesson,
        timetable_id: lesson.timetable_id || timetable?.id || "",
      };
      
      const newLesson = await TimetableService.addLesson(lessonWithTimetableId);
      
      // Update local state immediately for better UX
      if (timetable) {
        setTimetable({
          ...timetable,
          lessons: [...timetable.lessons, newLesson]
        });
      }
      
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
    setEditMode(prev => prev === "none" ? "edit" : "none");
  };

  const handleLoadDraft = (draftData: any) => {
    setTimetable(draftData);
    toast({
      title: "Success",
      description: "Draft loaded successfully",
    });
  };

  const handleRegenerateBatchLabs = async () => {
    try {
      setLoading(true);
      await TimetableService.regenerateBatchLabSchedules();
      
      // Refresh the timetable data
      await fetchData();
      
      toast({
        title: "Success",
        description: "Batch lab schedules regenerated successfully",
      });
    } catch (error) {
      console.error("Error regenerating batch labs:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate batch lab schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearBatchLabs = async () => {
    try {
      setLoading(true);
      await TimetableService.clearBatchLabSchedules();
      
      // Refresh the timetable data
      await fetchData();
      
      toast({
        title: "Success",
        description: "Batch lab schedules cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing batch labs:", error);
      toast({
        title: "Error",
        description: "Failed to clear batch lab schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      if (!timetable) return;

      // Save the current timetable state to the database
      await TimetableService.updateTimetable(timetable);
      
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
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshTimetable}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleSaveChanges} disabled={!timetable}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
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
          currentTimetableData={timetable}
          onLoadDraft={handleLoadDraft}
          onRegenerateBatchLabs={handleRegenerateBatchLabs}
          onClearBatchLabs={handleClearBatchLabs}
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
