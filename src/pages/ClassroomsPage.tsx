
import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Building } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ClassroomDialog } from "@/components/classroom/ClassroomDialog";
import { Classroom } from "@/types";
import { DataService } from "@/services/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const ClassroomsPage = () => {
  const [classrooms, setClassrooms] = React.useState<Classroom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedClassroom, setSelectedClassroom] = React.useState<Classroom | null>(null);
  const { toast } = useToast();
  const [activeView, setActiveView] = React.useState("all");

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await DataService.getClassrooms();
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

  React.useEffect(() => {
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
      if (classroom.id) {
        await DataService.updateClassroom(classroom);
        toast({
          title: "Success",
          description: "Classroom updated successfully",
        });
      } else {
        await DataService.addClassroom(classroom);
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
        <Badge variant={classroom.isLab ? "default" : "outline"}>
          {classroom.isLab ? "Laboratory" : "Classroom"}
        </Badge>
      )
    },
    {
      key: "building",
      title: "Building",
      render: (classroom: Classroom) => (
        <span>Main Building</span>
      )
    },
    {
      key: "floor",
      title: "Floor",
      render: (classroom: Classroom) => (
        <span>Ground Floor</span>
      )
    },
  ];

  return (
    <div className="animate-fade-in p-6">
      <PageHeader 
        title="Manage Classrooms" 
        description="View and manage classrooms and laboratories"
        icon={<Building className="h-6 w-6" />}
        actions={
          <Button onClick={handleAddClassroom}>Add Room</Button>
        }
      />

      <Tabs value={activeView} onValueChange={setActiveView} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Rooms</TabsTrigger>
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="labs">Laboratories</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable
            data={classrooms}
            columns={columns}
            isLoading={loading}
            onRowClick={handleEditClassroom}
          />
        </TabsContent>

        <TabsContent value="classrooms">
          <DataTable
            data={classrooms.filter(c => !c.isLab)}
            columns={columns}
            isLoading={loading}
            onRowClick={handleEditClassroom}
          />
        </TabsContent>

        <TabsContent value="labs">
          <DataTable
            data={classrooms.filter(c => c.isLab)}
            columns={columns}
            isLoading={loading}
            onRowClick={handleEditClassroom}
          />
        </TabsContent>
      </Tabs>

      <ClassroomDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        classroom={selectedClassroom}
        onSave={handleSaveClassroom}
      />
    </div>
  );
};

export default ClassroomsPage;
