
import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TimetableService } from "@/services/timetableService";
import { supabase } from "@/integrations/supabase/client";
import { Subject, Class } from "@/types";
import { SubjectFormDialog } from "@/components/subject/SubjectFormDialog";
import { SubjectList } from "@/components/subject/SubjectList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const Subjects = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [currentSubject, setCurrentSubject] = React.useState<Subject | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [subjectsData, classesData] = await Promise.all([
        TimetableService.getSubjects(),
        TimetableService.getClasses(),
      ]);
      setSubjects(subjectsData);
      setClasses(classesData);
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

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: Omit<Subject, "id">) => {
    try {
      if (currentSubject) {
        // Update subject
        const { error: subjectError } = await supabase
          .from('subjects')
          .update({
            name: data.name,
            code: data.code,
          })
          .eq('id', currentSubject.id);
        
        if (subjectError) throw subjectError;

        // Delete existing class assignments
        await supabase
          .from('subject_class_assignments')
          .delete()
          .eq('subject_id', currentSubject.id);

        // Insert new class assignments
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
        // Create new subject
        const { data: newSubject, error: subjectError } = await supabase
          .from('subjects')
          .insert({
            name: data.name,
            code: data.code,
          })
          .select()
          .single();
        
        if (subjectError) throw subjectError;

        // Insert class assignments
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
        // Delete class assignments first
        await supabase
          .from('subject_class_assignments')
          .delete()
          .eq('subject_id', currentSubject.id);

        // Delete the subject
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

  const resetForm = () => {
    setCurrentSubject(null);
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

      <SubjectList
        subjects={subjects}
        classes={classes}
        onEdit={(subject) => {
          setCurrentSubject(subject);
          setIsDialogOpen(true);
        }}
        onDelete={(subject) => {
          setCurrentSubject(subject);
          setIsDeleteDialogOpen(true);
        }}
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
    </div>
  );
};

export default Subjects;
