
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Subject } from "@/types";
import { DataService } from "@/services/mockData";
import { Plus, Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Subjects = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await DataService.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subjects data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSubject = async () => {
    try {
      if (!formData.name || !formData.code) {
        toast({
          title: "Error",
          description: "Subject name and code are required.",
          variant: "destructive",
        });
        return;
      }

      if (currentSubject) {
        // Update existing subject
        const updatedSubject = await DataService.updateSubject({
          ...currentSubject,
          name: formData.name,
          code: formData.code,
        });

        setSubjects(subjects.map(s => 
          s.id === updatedSubject.id ? updatedSubject : s
        ));

        toast({
          title: "Success",
          description: "Subject updated successfully.",
        });
      } else {
        // Add new subject
        const newSubject = await DataService.addSubject({
          name: formData.name,
          code: formData.code,
        });

        setSubjects([...subjects, newSubject]);

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
        description: "Failed to save subject data.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubject = async () => {
    try {
      if (currentSubject) {
        await DataService.deleteSubject(currentSubject.id);
        setSubjects(subjects.filter(s => s.id !== currentSubject.id));
        
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

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (subject: Subject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (subject: Subject) => {
    setCurrentSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentSubject(null);
    setFormData({
      name: "",
      code: "",
    });
  };

  const columns = [
    { key: "name", title: "Name" },
    { key: "code", title: "Code" },
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
              openEditDialog(subject);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(subject);
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
        title="Subjects"
        description="Manage courses and subjects"
        actions={
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        }
      />

      <DataTable
        data={subjects}
        columns={columns}
        isLoading={loading}
      />

      {/* Add/Edit Subject Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentSubject ? "Edit Subject" : "Add New Subject"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter subject name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Subject Code *</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g. CS101"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubject}>
              {currentSubject ? "Update" : "Add"}
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
            Are you sure you want to delete the subject{" "}
            <span className="font-semibold">{currentSubject?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subjects;
