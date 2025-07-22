import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { TimetableService } from "@/services/timetableService";
import { supabase } from "@/integrations/supabase/client";
import { Class, Batch } from "@/types";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const Classes = () => {
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [currentClass, setCurrentClass] = React.useState<Class | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    year_id: "",
  });
  
  // Batch state
  const [isBatchDialogOpen, setIsBatchDialogOpen] = React.useState(false);
  const [currentBatch, setCurrentBatch] = React.useState<Batch | null>(null);
  const [batchFormData, setBatchFormData] = React.useState<Partial<Batch>>({
    name: "",
  });
  const [expandedClassId, setExpandedClassId] = React.useState<string | null>(null);

  const fetchClasses = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await TimetableService.getClasses();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch classes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBatchFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('classes')
        .insert({
          name: formData.name || "",
          year_id: formData.year_id || "",
        });
      toast({
        title: "Success",
        description: "Class added successfully",
      });
      setIsAddDialogOpen(false);
      setFormData({ name: "", year_id: "" });
      fetchClasses();
    } catch (error) {
      console.error("Error adding class:", error);
      toast({
        title: "Error",
        description: "Failed to add class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;
    
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name: formData.name || currentClass.name,
          year_id: formData.year_id || currentClass.year_id,
        })
        .eq('id', currentClass.id);
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
      setIsEditDialogOpen(false);
      setCurrentClass(null);
      setFormData({ name: "", year_id: "" });
      fetchClasses();
    } catch (error) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: "Failed to update class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async () => {
    if (!currentClass) return;
    
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', currentClass.id);
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setCurrentClass(null);
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;
    
    try {
      // Batch functionality would need to be implemented in Supabase
      toast({
        title: "Info",
        description: "Batch functionality not yet implemented",
      });
      setIsBatchDialogOpen(false);
      setBatchFormData({ name: "" });
    } catch (error) {
      console.error("Error adding batch:", error);
      toast({
        title: "Error",
        description: "Failed to add batch. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      // Batch functionality would need to be implemented in Supabase
      toast({
        title: "Info",
        description: "Batch functionality not yet implemented",
      });
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({
        title: "Error",
        description: "Failed to delete batch. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (classItem: Class) => {
    setCurrentClass(classItem);
    setFormData({
      name: classItem.name,
      year_id: classItem.year_id || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (classItem: Class) => {
    setCurrentClass(classItem);
    setIsDeleteDialogOpen(true);
  };

  const toggleExpand = (classId: string) => {
    setExpandedClassId(expandedClassId === classId ? null : classId);
  };

  const columns = [
    { 
      key: "name", 
      title: "Class Name",
      render: (classItem: Class) => (
        <div>
          <Collapsible
            open={expandedClassId === classItem.id}
            onOpenChange={() => toggleExpand(classItem.id)}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <span>{classItem.name}</span>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-1" />
                  Info
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2">
              <div className="pl-4 border-l-2 border-gray-200">
                <p className="text-gray-500 text-sm">Year ID: {classItem.year_id || 'Not assigned'}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )
    },
    { key: "year_id", title: "Year ID" },
    {
      key: "actions",
      title: "Actions",
      render: (classItem: Class) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(classItem);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(classItem);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Classes Management" 
        description="Add, edit or remove classes" 
        actions={
          <Button onClick={() => {
            setFormData({ name: "", year_id: "" });
            setIsAddDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        }
      />

      <DataTable 
        data={classes} 
        columns={columns} 
        isLoading={loading}
      />

      {/* Add Class Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>
              Enter the details for the new class
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClass}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Year 1 Computer Science"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year_id">Year ID</Label>
                <Input
                  id="year_id"
                  name="year_id"
                  placeholder="e.g., year-uuid"
                  value={formData.year_id}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Class</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update the class details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditClass}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Class Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="e.g., Year 1 Computer Science"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-year_id">Year ID</Label>
                <Input
                  id="edit-year_id"
                  name="year_id"
                  placeholder="e.g., year-uuid"
                  value={formData.year_id}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Class</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the class "{currentClass?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteClass}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Batch Dialog */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
            <DialogDescription>
              {currentClass && `Add a new batch to ${currentClass.name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBatch}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="batch-name">Batch Name</Label>
                <Input
                  id="batch-name"
                  name="name"
                  placeholder="e.g., Batch A"
                  value={batchFormData.name}
                  onChange={handleBatchInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsBatchDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Batch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classes;
