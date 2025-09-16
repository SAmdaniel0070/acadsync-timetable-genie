import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { TimetableService } from "@/services/timetableService";
import { supabase } from "@/integrations/supabase/client";
import { Subject, Class, LabSchedule, Teacher, Classroom, TimeSlot, Batch } from "@/types";
import { SubjectFormDialog } from "@/components/subject/SubjectFormDialog";
import { SubjectList } from "@/components/subject/SubjectList";
import { LabScheduleDialog } from "@/components/subject/LabScheduleDialog";
import { TeacherAssignmentDialog } from "@/components/subject/TeacherAssignmentDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SelectableDataTable } from "@/components/ui/selectable-data-table";

const Subjects = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = React.useState<Subject[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = React.useState<Classroom[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [labSchedules, setLabSchedules] = React.useState<LabSchedule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);
  const [isLabDialogOpen, setIsLabDialogOpen] = React.useState(false);
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = React.useState(false);
  const [currentSubject, setCurrentSubject] = React.useState<Subject | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [subjectsData, classesData, teachersData, classroomsData, timeSlotsData, batchesData] = await Promise.all([
        TimetableService.getSubjects(),
        TimetableService.getClasses(),
        TimetableService.getTeachers(),
        TimetableService.getClassrooms(),
        TimetableService.getTimeSlots(),
        supabase.from('batches').select('*'),
      ]);
      
      setSubjects(subjectsData);
      setClasses(classesData);
      setTeachers(teachersData);
      setClassrooms(classroomsData);
      setTimeSlots(timeSlotsData);
      setBatches(batchesData.data || []);
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
  }, [toast]);

  const fetchLabSchedules = React.useCallback(async (subjectId: string) => {
    try {
      const { data, error } = await supabase
        .from('lab_schedules')
        .select('*')
        .eq('subject_id', subjectId);
      
      if (error) throw error;
      setLabSchedules(data || []);
    } catch (error) {
      console.error("Error fetching lab schedules:", error);
      toast({
        title: "Error",
        description: "Failed to fetch lab schedules.",
        variant: "destructive",
      });
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: Omit<Subject, "id">) => {
    try {
      if (currentSubject) {
        const { error: subjectError } = await supabase
          .from('subjects')
          .update({
            name: data.name,
            code: data.code,
            periods_per_week: data.periodsPerWeek,
            is_lab: data.isLab,
            lab_duration_hours: data.lab_duration_hours,
          })
          .eq('id', currentSubject.id);
        
        if (subjectError) throw subjectError;

        await supabase
          .from('subject_class_assignments')
          .delete()
          .eq('subject_id', currentSubject.id);

        if (data.classes && data.classes.length > 0) {
          const assignments = data.classes.map(classId => ({
            subject_id: currentSubject.id,
            class_id: classId
          }));
          
          const { error: assignmentError } = await supabase
            .from('subject_class_assignments')
            .insert(assignments);
          
          if (assignmentError) throw assignmentError;
        }
        
        await fetchData();
        toast({
          title: "Success",
          description: "Subject updated successfully.",
        });
      } else {
        const { data: newSubject, error: subjectError } = await supabase
          .from('subjects')
          .insert({
            name: data.name,
            code: data.code,
            periods_per_week: data.periodsPerWeek,
            is_lab: data.isLab,
            lab_duration_hours: data.lab_duration_hours,
          })
          .select()
          .single();
        
        if (subjectError) throw subjectError;

        if (data.classes && data.classes.length > 0) {
          const assignments = data.classes.map(classId => ({
            subject_id: newSubject.id,
            class_id: classId
          }));
          
          const { error: assignmentError } = await supabase
            .from('subject_class_assignments')
            .insert(assignments);
          
          if (assignmentError) throw assignmentError;
        }
        
        await fetchData();
        toast({
          title: "Success",
          description: "Subject added successfully.",
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving subject:", error);
      toast({
        title: "Error",
        description: "Failed to save subject.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (currentSubject) {
        await supabase
          .from('subject_class_assignments')
          .delete()
          .eq('subject_id', currentSubject.id);

        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', currentSubject.id);
        
        if (error) throw error;
        await fetchData();
        toast({
          title: "Success",
          description: "Subject deleted successfully.",
        });
        setIsDeleteDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({
        title: "Error",
        description: "Failed to delete subject.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const subject of selectedSubjects) {
        await supabase
          .from('subject_class_assignments')
          .delete()
          .eq('subject_id', subject.id);
      }

      const subjectIds = selectedSubjects.map(s => s.id);
      const { error } = await supabase
        .from('subjects')
        .delete()
        .in('id', subjectIds);
      
      if (error) throw error;
      await fetchData();
      toast({
        title: "Success",
        description: `${selectedSubjects.length} subjects deleted successfully.`,
      });
      setIsBulkDeleteDialogOpen(false);
      setSelectedSubjects([]);
    } catch (error) {
      console.error("Error deleting subjects:", error);
      toast({
        title: "Error",
        description: "Failed to delete subjects.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCurrentSubject(null);
  };

  const handleManageLabs = async (subject: Subject) => {
    setCurrentSubject(subject);
    await fetchLabSchedules(subject.id);
    setIsLabDialogOpen(true);
  };

  const handleManageTeachers = (subject: Subject) => {
    setCurrentSubject(subject);
    setIsTeacherDialogOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Subjects"
        description="Manage subjects and their assignments to classes"
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        }
      />

      <SelectableDataTable
        data={subjects}
        columns={[
          { key: "name", title: "Name" },
          { key: "code", title: "Code" },
          { 
            key: "periodsPerWeek", 
            title: "Periods/Week",
            render: (subject: Subject) => subject.periodsPerWeek || 0
          },
          { 
            key: "isLab", 
            title: "Type",
            render: (subject: Subject) => subject.isLab ? "Lab" : "Theory"
          },
          {
            key: "actions",
            title: "Actions",
            render: (subject: Subject) => (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSubject(subject);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSubject(subject);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        selectedItems={selectedSubjects}
        onSelectionChange={setSelectedSubjects}
        onBulkDelete={() => setIsBulkDeleteDialogOpen(true)}
        isLoading={loading}
      />

      <SubjectFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        classes={classes}
        currentSubject={currentSubject}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the subject{" "}
            <span className="font-semibold">{currentSubject?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedSubjects.length} selected subject{selectedSubjects.length > 1 ? 's' : ''}? This will also delete all associated class assignments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedSubjects.length} Subject{selectedSubjects.length > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentSubject && (
        <>
          <LabScheduleDialog
            open={isLabDialogOpen}
            onOpenChange={setIsLabDialogOpen}
            subjectId={currentSubject.id}
            subjectName={currentSubject.name}
            teachers={teachers}
            classrooms={classrooms}
            timeSlots={timeSlots}
            classes={classes}
            batches={batches}
            labSchedules={labSchedules}
            onLabSchedulesChange={() => fetchLabSchedules(currentSubject.id)}
          />
          <TeacherAssignmentDialog
            open={isTeacherDialogOpen}
            onOpenChange={setIsTeacherDialogOpen}
            subject={currentSubject}
            teachers={teachers}
            batches={batches}
            onAssignmentsChange={fetchData}
          />
        </>
      )}
    </div>
  );
};

export default Subjects;
