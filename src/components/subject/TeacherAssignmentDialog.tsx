import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Teacher, Batch, Subject, BatchTeacherAssignment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeacherAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject | null;
  teachers: Teacher[];
  batches: Batch[];
  onAssignmentsChange: () => void;
}

export const TeacherAssignmentDialog = ({
  open,
  onOpenChange,
  subject,
  teachers,
  batches,
  onAssignmentsChange,
}: TeacherAssignmentDialogProps) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = React.useState<BatchTeacherAssignment[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && subject) {
      fetchAssignments();
    }
  }, [open, subject]);

  const fetchAssignments = async () => {
    if (!subject) return;
    
    try {
      const { data, error } = await supabase
        .from('batch_teacher_assignments')
        .select('*')
        .eq('subject_id', subject.id);
      
      if (error) throw error;
      setAssignments((data || []).map(item => ({
        ...item,
        assignment_type: item.assignment_type as 'theory' | 'lab'
      })));
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teacher assignments.",
        variant: "destructive",
      });
    }
  };

  const handleAssignment = async (batchId: string, teacherId: string, assignmentType: 'theory' | 'lab') => {
    if (!subject) return;
    
    try {
      setLoading(true);
      
      // Check if assignment already exists
      const existingAssignment = assignments.find(
        a => a.batch_id === batchId && a.assignment_type === assignmentType
      );
      
      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('batch_teacher_assignments')
          .update({ teacher_id: teacherId })
          .eq('id', existingAssignment.id);
        
        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('batch_teacher_assignments')
          .insert({
            subject_id: subject.id,
            batch_id: batchId,
            teacher_id: teacherId,
            assignment_type: assignmentType
          });
        
        if (error) throw error;
      }
      
      await fetchAssignments();
      onAssignmentsChange();
      
      toast({
        title: "Success",
        description: "Teacher assignment updated successfully.",
      });
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update teacher assignment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('batch_teacher_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      await fetchAssignments();
      onAssignmentsChange();
      
      toast({
        title: "Success",
        description: "Teacher assignment removed successfully.",
      });
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast({
        title: "Error",
        description: "Failed to remove teacher assignment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssignedTeacher = (batchId: string, assignmentType: 'theory' | 'lab') => {
    return assignments.find(a => a.batch_id === batchId && a.assignment_type === assignmentType);
  };

  const subjectBatches = batches.filter(batch => 
    subject?.classes?.some(classId => 
      batches.find(b => b.id === batch.id)?.class_id === classId
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Assign Teachers - {subject?.name} ({subject?.code})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {subjectBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No batches found for this subject's classes.</p>
              <p className="text-sm">Please create batches for the assigned classes first.</p>
            </div>
          ) : (
            subjectBatches.map((batch) => (
              <div key={batch.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{batch.name}</h3>
                  <Badge variant="outline">
                    {batches.find(b => b.class_id === batch.class_id) ? 
                      `${batches.filter(b => b.class_id === batch.class_id).find(b => b.id === batch.id)?.name}` : 
                      'Unknown Class'
                    }
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Theory Teacher Assignment */}
                  <div className="space-y-2">
                    <Label>Theory Teacher</Label>
                    <div className="flex gap-2">
                      <Select
                        value={getAssignedTeacher(batch.id, 'theory')?.teacher_id || ''}
                        onValueChange={(teacherId) => handleAssignment(batch.id, teacherId, 'theory')}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {getAssignedTeacher(batch.id, 'theory') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAssignment(getAssignedTeacher(batch.id, 'theory')!.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Lab Teacher Assignment (only if subject has lab) */}
                  {subject?.isLab && (
                    <div className="space-y-2">
                      <Label>Lab Teacher</Label>
                      <div className="flex gap-2">
                        <Select
                          value={getAssignedTeacher(batch.id, 'lab')?.teacher_id || ''}
                          onValueChange={(teacherId) => handleAssignment(batch.id, teacherId, 'lab')}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {getAssignedTeacher(batch.id, 'lab') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAssignment(getAssignedTeacher(batch.id, 'lab')!.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};