
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SelectableDataTable } from "@/components/ui/selectable-data-table";
import { Teacher, Subject } from "@/types";
import { TimetableService } from "@/services/timetableService";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const Teachers = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [deletedTeachers, setDeletedTeachers] = useState<Teacher[]>([]);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    selectedSubjects: [] as string[],
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      
      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*');
      
      if (teachersError) throw teachersError;

      // Fetch teacher-subject assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('teacher_subject_assignments')
        .select('teacher_id, subject_id');
      
      if (assignmentsError) throw assignmentsError;

      // Combine data
      const teachersWithSubjects = (teachersData || []).map((teacher: any) => ({
        ...teacher,
        subjects: (assignmentsData || [])
          .filter((a: any) => a.teacher_id === teacher.id)
          .map((a: any) => a.subject_id)
      }));
      
      setTeachers(teachersWithSubjects);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teachers data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await TimetableService.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSubject = (subjectId: string) => {
    if (!formData.selectedSubjects.includes(subjectId)) {
      setFormData({ 
        ...formData, 
        selectedSubjects: [...formData.selectedSubjects, subjectId] 
      });
    }
  };

  const handleRemoveSubject = (subjectId: string) => {
    setFormData({ 
      ...formData, 
      selectedSubjects: formData.selectedSubjects.filter(id => id !== subjectId) 
    });
  };

  const handleAddTeacher = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Teacher name is required.",
          variant: "destructive",
        });
        return;
      }

      if (formData.selectedSubjects.length === 0) {
        toast({
          title: "Error",
          description: "Please assign at least one subject to the teacher.",
          variant: "destructive",
        });
        return;
      }

      if (currentTeacher) {
        // Update existing teacher
        const { error: teacherError } = await supabase
          .from('teachers')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          })
          .eq('id', currentTeacher.id);

        if (teacherError) throw teacherError;

        // Delete old subject assignments
        const { error: deleteError } = await supabase
          .from('teacher_subject_assignments')
          .delete()
          .eq('teacher_id', currentTeacher.id);

        if (deleteError) throw deleteError;

        // Insert new subject assignments
        const assignments = formData.selectedSubjects.map(subjectId => ({
          teacher_id: currentTeacher.id,
          subject_id: subjectId
        }));

        const { error: assignError } = await supabase
          .from('teacher_subject_assignments')
          .insert(assignments);

        if (assignError) throw assignError;

        toast({
          title: "Success",
          description: "Teacher updated successfully.",
        });
      } else {
        // Add new teacher
        const { data: newTeacher, error: teacherError } = await supabase
          .from('teachers')
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          })
          .select()
          .single();

        if (teacherError) throw teacherError;

        // Insert subject assignments
        const assignments = formData.selectedSubjects.map(subjectId => ({
          teacher_id: newTeacher.id,
          subject_id: subjectId
        }));

        const { error: assignError } = await supabase
          .from('teacher_subject_assignments')
          .insert(assignments);

        if (assignError) throw assignError;

        toast({
          title: "Success",
          description: "Teacher added successfully.",
        });
      }
      
      await fetchTeachers();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast({
        title: "Error",
        description: "Failed to save teacher data.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeacher = async () => {
    try {
      if (currentTeacher) {
        const { error } = await supabase
          .from('teachers')
          .delete()
          .eq('id', currentTeacher.id);
        
        if (error) throw error;
        await fetchTeachers();
        
        toast({
          title: "Success",
          description: "Teacher deleted successfully.",
        });
        
        setIsDeleteDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Error",
        description: "Failed to delete teacher.",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email || "",
      phone: teacher.phone || "",
      selectedSubjects: teacher.subjects || [],
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = async () => {
    try {
      const teachersToDelete = [...selectedTeachers];
      const teacherIds = teachersToDelete.map(t => t.id);
      
      // Remove from UI immediately
      setTeachers(teachers.filter(t => !teacherIds.includes(t.id)));
      setDeletedTeachers(teachersToDelete);
      setSelectedTeachers([]);
      
      // Clear any existing timeout
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
      }
      
      // Set up undo timeout - delete from database after 10 seconds
      const timeoutId = setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('teachers')
            .delete()
            .in('id', teacherIds);
          
          if (error) {
            console.error("Error permanently deleting teachers:", error);
            // If permanent deletion fails, restore the teachers
            setTeachers(prev => [...prev, ...teachersToDelete]);
            toast({
              title: "Error",
              description: "Failed to permanently delete teachers. They have been restored.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error in permanent deletion:", error);
        } finally {
          setDeletedTeachers([]);
          setUndoTimeoutId(null);
        }
      }, 10000);
      
      setUndoTimeoutId(timeoutId);
      
      // Show undo toast
      toast({
        title: "Teachers deleted",
        description: `${teachersToDelete.length} teacher${teachersToDelete.length > 1 ? 's' : ''} deleted successfully.`,
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleUndoDelete}
          >
            Undo
          </Button>
        ),
      });
      
    } catch (error) {
      console.error("Error deleting teachers:", error);
      toast({
        title: "Error",
        description: "Failed to delete teachers.",
        variant: "destructive",
      });
    }
  };

  const handleUndoDelete = async () => {
    try {
      if (deletedTeachers.length === 0) return;
      
      // Clear the timeout to prevent permanent deletion
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        setUndoTimeoutId(null);
      }
      
      // Restore to UI (no need to restore to database since it wasn't deleted yet)
      setTeachers(prev => [...prev, ...deletedTeachers]);
      setDeletedTeachers([]);
      
      toast({
        title: "Restored",
        description: "Teachers have been restored successfully.",
      });
      
    } catch (error) {
      console.error("Error restoring teachers:", error);
      toast({
        title: "Error",
        description: "Failed to restore teachers.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCurrentTeacher(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      selectedSubjects: [],
    });
  };

  const columns = [
    { key: "name", title: "Name" },
    { key: "email", title: "Email" },
    {
      key: "subjects",
      title: "Subjects",
      render: (teacher: Teacher) => {
        const teacherSubjects = subjects.filter(s => 
          teacher.subjects?.includes(s.id)
        );
        return (
          <div className="flex flex-wrap gap-1">
            {teacherSubjects.length > 0 ? (
              teacherSubjects.map(subject => (
                <Badge key={subject.id} variant="secondary">
                  {subject.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">No subjects</span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (teacher: Teacher) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(teacher);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(teacher);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teachers"
        description="Manage faculty members"
        actions={
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      <SelectableDataTable
        data={teachers}
        columns={columns}
        selectedItems={selectedTeachers}
        onSelectionChange={setSelectedTeachers}
        onBulkDelete={handleBulkDelete}
        isLoading={loading}
      />

      {/* Add/Edit Teacher Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentTeacher ? "Edit Teacher" : "Add New Teacher"}
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
                placeholder="Enter teacher name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter teacher email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter teacher phone"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subjects">Subjects *</Label>
              <Select onValueChange={handleAddSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subjects to assign" />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    .filter(s => !formData.selectedSubjects.includes(s.id))
                    .map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formData.selectedSubjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.selectedSubjects.map(subjectId => {
                    const subject = subjects.find(s => s.id === subjectId);
                    return subject ? (
                      <Badge key={subjectId} variant="secondary" className="gap-1">
                        {subject.name} ({subject.code})
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveSubject(subjectId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeacher}>
              {currentTeacher ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the teacher{" "}
            <span className="font-semibold">{currentTeacher?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeacher}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;
