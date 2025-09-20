
import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Classroom } from "@/types";
import { TimetableService } from "@/services/timetableService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, PenSquare, Trash2, BuildingIcon } from "lucide-react";
import { ClassroomDialog } from "@/components/classroom/ClassroomDialog";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Classrooms() {
  const { toast } = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);
  const [activeView, setActiveView] = useState("all");

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await TimetableService.getClassrooms();
      setClassrooms(data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch classrooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleAddClassroom = () => {
    setSelectedClassroom(null);
    setIsDialogOpen(true);
  };

  const handleEditClassroom = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setIsDialogOpen(true);
  };

  const handleSaveClassroom = async (classroom: Classroom) => {
    try {
      let updatedClassroom;
      
      if (classroom.id) {
        // Update existing classroom
        const { error } = await supabase
          .from('classrooms')
          .update({
            name: classroom.name,
            capacity: classroom.capacity,
            is_lab: classroom.isLab,
          })
          .eq('id', classroom.id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Classroom updated successfully",
        });
      } else {
        // Add new classroom
        const { error } = await supabase
          .from('classrooms')
          .insert({
            name: classroom.name,
            capacity: classroom.capacity,
            is_lab: classroom.isLab,
          });
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Classroom added successfully",
        });
      }
      
      await fetchClassrooms();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving classroom:", error);
      toast({
        title: "Error",
        description: "Failed to save classroom",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (classroom: Classroom) => {
    setClassroomToDelete(classroom);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!classroomToDelete) return;
    
    try {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', classroomToDelete.id);
      
      if (error) throw error;
      await fetchClassrooms();
      toast({
        title: "Success",
        description: "Classroom deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting classroom:", error);
      toast({
        title: "Error",
        description: "Failed to delete classroom",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "name", title: "Name" },
    { 
      key: "capacity", 
      title: "Capacity",
      render: (classroom: Classroom) => (
        <span>{classroom.capacity} students</span>
      )
    },
    { 
      key: "type", 
      title: "Type",
      render: (classroom: Classroom) => (
        <Badge variant={classroom.is_lab ? "default" : "outline"}>
          {classroom.is_lab ? "Laboratory" : "Classroom"}
        </Badge>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (classroom: Classroom) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClassroom(classroom);
            }}
          >
            <PenSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(classroom);
            }}
            className="text-destructive hover:text-destructive"
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
        title="Classrooms"
        description="Manage classrooms and labs"
        icon={<BuildingIcon className="h-6 w-6" />}
        actions={
          <Button onClick={handleAddClassroom}>
            <Plus className="mr-2 h-4 w-4" />
            Add Classroom
          </Button>
        }
      />

      <Tabs defaultValue="all" onValueChange={setActiveView} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Classrooms</TabsTrigger>
          <TabsTrigger value="labs">Labs Only</TabsTrigger>
          <TabsTrigger value="regular">Regular Classrooms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          <DataTable
            data={classrooms}
            columns={columns}
            isLoading={loading}
          />
        </TabsContent>
        
        <TabsContent value="labs" className="space-y-4 mt-4">
          <DataTable
            data={classrooms.filter(c => c.is_lab)}
            columns={columns}
            isLoading={loading}
          />
        </TabsContent>
        
        <TabsContent value="regular" className="space-y-4 mt-4">
          <DataTable
            data={classrooms.filter(c => !c.is_lab)}
            columns={columns}
            isLoading={loading}
          />
        </TabsContent>
      </Tabs>

      {/* Classroom Dialog */}
      <ClassroomDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        classroom={selectedClassroom}
        onSave={handleSaveClassroom}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {classroomToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
