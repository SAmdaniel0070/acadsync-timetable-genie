
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Teacher } from "@/types";
import { DataService } from "@/services/mockData";
import { Plus, Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Teachers = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subjects: [] as string[],
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await DataService.getTeachers();
      setTeachers(data);
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

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const subjects = e.target.value.split(",").map(s => s.trim());
    setFormData({ ...formData, subjects });
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

      if (currentTeacher) {
        // Update existing teacher
        const updatedTeacher = await DataService.updateTeacher({
          ...currentTeacher,
          name: formData.name,
          email: formData.email,
          subjects: formData.subjects,
        });

        setTeachers(teachers.map(t => 
          t.id === updatedTeacher.id ? updatedTeacher : t
        ));

        toast({
          title: "Success",
          description: "Teacher updated successfully.",
        });
      } else {
        // Add new teacher
        const newTeacher = await DataService.addTeacher({
          name: formData.name,
          email: formData.email,
          subjects: formData.subjects,
        });

        setTeachers([...teachers, newTeacher]);

        toast({
          title: "Success",
          description: "Teacher added successfully.",
        });
      }
      
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
        await DataService.deleteTeacher(currentTeacher.id);
        setTeachers(teachers.filter(t => t.id !== currentTeacher.id));
        
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
      subjects: teacher.subjects,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentTeacher(null);
    setFormData({
      name: "",
      email: "",
      subjects: [],
    });
  };

  const columns = [
    { key: "name", title: "Name" },
    { key: "email", title: "Email" },
    {
      key: "subjects",
      title: "Subjects",
      render: (teacher: Teacher) => (
        <span>{teacher.subjects.length} subjects assigned</span>
      ),
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

      <DataTable
        data={teachers}
        columns={columns}
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
              <Label htmlFor="subjects">Subjects (comma separated subject IDs)</Label>
              <Input
                id="subjects"
                name="subjects"
                value={formData.subjects.join(", ")}
                onChange={handleSubjectsChange}
                placeholder="e.g. s1, s2, s3"
              />
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
