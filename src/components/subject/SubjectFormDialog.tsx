
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Class, Subject } from "@/types";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Subject>) => void;
  classes: Class[];
  currentSubject: Subject | null;
}

export const SubjectFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  classes,
  currentSubject,
}: SubjectFormDialogProps) => {
  const [formData, setFormData] = React.useState({
    name: currentSubject?.name || "",
    code: currentSubject?.code || "",
    selectedClasses: currentSubject?.classes || []
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter subject name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="code">Subject Code *</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. CS101"
            />
          </div>
          <div className="grid gap-2">
            <Label>Assign to Classes</Label>
            <Select
              value={formData.selectedClasses.join(",")}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                selectedClasses: value ? value.split(",") : [] 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select classes" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {currentSubject ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
