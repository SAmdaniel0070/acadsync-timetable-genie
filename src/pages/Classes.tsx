import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SelectableDataTable } from "@/components/ui/selectable-data-table";
import { TimetableService } from "@/services/timetableService";
import { supabase } from "@/integrations/supabase/client";
import { Class, Batch } from "@/types";
import { Plus, Pencil, Trash2, Users, UserPlus, Layers } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Classes = () => {
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);
  const [currentClass, setCurrentClass] = React.useState<Class | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    year_id: "",
    student_count: "",
  });
  
  // Batch state
  const [isBatchDialogOpen, setIsBatchDialogOpen] = React.useState(false);
  const [isDivideBatchDialogOpen, setIsDivideBatchDialogOpen] = React.useState(false);
  const [currentBatch, setCurrentBatch] = React.useState<Batch | null>(null);
  const [batchFormData, setBatchFormData] = React.useState<Partial<Batch>>({
    name: "",
    strength: 0,
  });
  const [expandedClassId, setExpandedClassId] = React.useState<string | null>(null);
  const [batches, setBatches] = React.useState<{ [classId: string]: Batch[] }>({});
  const [batchCount, setBatchCount] = React.useState<4 | 5>(4);

  const fetchClasses = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await TimetableService.getClasses();
      setClasses(data);
      
      // Fetch batches for each class
      const batchData: { [classId: string]: Batch[] } = {};
      for (const classItem of data) {
        const { data: classBatches } = await supabase
          .from('batches')
          .select('*')
          .eq('class_id', classItem.id);
        batchData[classItem.id] = classBatches || [];
      }
      setBatches(batchData);
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
          student_count: parseInt(formData.student_count) || 0,
        });
      toast({
        title: "Success",
        description: "Class added successfully",
      });
      setIsAddDialogOpen(false);
      setFormData({ name: "", year_id: "", student_count: "" });
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
          student_count: parseInt(formData.student_count) || currentClass.student_count || 0,
        })
        .eq('id', currentClass.id);
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
      setIsEditDialogOpen(false);
      setCurrentClass(null);
      setFormData({ name: "", year_id: "", student_count: "" });
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
      const { error } = await supabase
        .from('batches')
        .insert({
          name: batchFormData.name || "",
          class_id: currentClass.id,
          strength: batchFormData.strength || 0,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Batch added successfully",
      });
      setIsBatchDialogOpen(false);
      setBatchFormData({ name: "", strength: 0 });
      fetchClasses();
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
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
      fetchClasses();
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({
        title: "Error",
        description: "Failed to delete batch. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDivideBatches = async () => {
    if (!currentClass || !currentClass.student_count) return;

    try {
      const studentsPerBatch = Math.floor(currentClass.student_count / batchCount);
      const extraStudents = currentClass.student_count % batchCount;

      // Delete existing batches for this class
      await supabase
        .from('batches')
        .delete()
        .eq('class_id', currentClass.id);

      // Create new batches
      const batchPromises = [];
      for (let i = 0; i < batchCount; i++) {
        const batchSize = studentsPerBatch + (i < extraStudents ? 1 : 0);
        batchPromises.push(
          supabase
            .from('batches')
            .insert({
              name: `Batch ${String.fromCharCode(65 + i)}`, // A, B, C, D, E
              class_id: currentClass.id,
              strength: batchSize,
            })
        );
      }

      await Promise.all(batchPromises);

      toast({
        title: "Success",
        description: `Class divided into ${batchCount} batches successfully`,
      });
      setIsDivideBatchDialogOpen(false);
      fetchClasses();
    } catch (error) {
      console.error("Error dividing batches:", error);
      toast({
        title: "Error",
        description: "Failed to divide batches. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Delete batches for selected classes first
      for (const classItem of selectedClasses) {
        await supabase
          .from('batches')
          .delete()
          .eq('class_id', classItem.id);
      }

      // Delete the classes
      const classIds = selectedClasses.map(c => c.id);
      const { error } = await supabase
        .from('classes')
        .delete()
        .in('id', classIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedClasses.length} classes deleted successfully`,
      });
      setIsBulkDeleteDialogOpen(false);
      setSelectedClasses([]);
      fetchClasses();
    } catch (error) {
      console.error("Error deleting classes:", error);
      toast({
        title: "Error",
        description: "Failed to delete classes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (classItem: Class) => {
    setCurrentClass(classItem);
    setFormData({
      name: classItem.name,
      year_id: classItem.year_id || "",
      student_count: classItem.student_count?.toString() || "",
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
              <div className="flex items-center gap-2">
                <span>{classItem.name}</span>
                <Badge variant="outline" className="ml-2">
                  {classItem.student_count || 0} students
                </Badge>
                {batches[classItem.id] && batches[classItem.id].length > 0 && (
                  <Badge variant="secondary">
                    {batches[classItem.id].length} batches
                  </Badge>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2">
              <div className="pl-4 border-l-2 border-muted">
                <p className="text-muted-foreground text-sm mb-2">Year ID: {classItem.year_id || 'Not assigned'}</p>
                
                {batches[classItem.id] && batches[classItem.id].length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Batches:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {batches[classItem.id].map((batch) => (
                        <div key={batch.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">{batch.name} ({batch.strength} students)</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBatch(batch.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentClass(classItem);
                      setIsBatchDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Add Batch
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentClass(classItem);
                      setIsDivideBatchDialogOpen(true);
                    }}
                    disabled={!classItem.student_count || classItem.student_count < 4}
                  >
                    <Layers className="h-3 w-3 mr-1" />
                    Divide Batches
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )
    },
    { 
      key: "student_count", 
      title: "Students",
      render: (classItem: Class) => (
        <Badge variant="outline">
          {classItem.student_count || 0}
        </Badge>
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
            className="text-destructive hover:text-destructive"
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
            setFormData({ name: "", year_id: "", student_count: "" });
            setIsAddDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        }
      />

      <SelectableDataTable 
        data={classes} 
        columns={columns} 
        selectedItems={selectedClasses}
        onSelectionChange={setSelectedClasses}
        onBulkDelete={() => setIsBulkDeleteDialogOpen(true)}
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
              <div className="grid gap-2">
                <Label htmlFor="student_count">Number of Students</Label>
                <Input
                  id="student_count"
                  name="student_count"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.student_count}
                  onChange={handleInputChange}
                  min="0"
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
              <div className="grid gap-2">
                <Label htmlFor="edit-student_count">Number of Students</Label>
                <Input
                  id="edit-student_count"
                  name="student_count"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.student_count}
                  onChange={handleInputChange}
                  min="0"
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
              <div className="grid gap-2">
                <Label htmlFor="batch-strength">Number of Students</Label>
                <Input
                  id="batch-strength"
                  name="strength"
                  type="number"
                  placeholder="e.g., 15"
                  value={batchFormData.strength?.toString() || ""}
                  onChange={(e) => setBatchFormData(prev => ({ ...prev, strength: parseInt(e.target.value) || 0 }))}
                  min="0"
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

      {/* Divide Batches Dialog */}
      <Dialog open={isDivideBatchDialogOpen} onOpenChange={setIsDivideBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Divide Class into Batches</DialogTitle>
            <DialogDescription>
              {currentClass && `Divide ${currentClass.name} (${currentClass.student_count} students) into equal batches`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Number of Batches</Label>
              <Select value={batchCount.toString()} onValueChange={(value) => setBatchCount(value as "4" | "5" === "4" ? 4 : 5)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Batches</SelectItem>
                  <SelectItem value="5">5 Batches</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentClass?.student_count && (
              <div className="text-sm text-muted-foreground">
                Each batch will have approximately {Math.floor(currentClass.student_count / batchCount)} students
                {currentClass.student_count % batchCount > 0 && 
                  ` (${currentClass.student_count % batchCount} batch${currentClass.student_count % batchCount > 1 ? 'es' : ''} will have 1 extra student)`
                }
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDivideBatchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDivideBatches}>
              Divide Batches
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedClasses.length} selected class{selectedClasses.length > 1 ? 'es' : ''}? This will also delete all associated batches. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedClasses.length} Class{selectedClasses.length > 1 ? 'es' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classes;
