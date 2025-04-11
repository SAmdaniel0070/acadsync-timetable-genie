
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Classroom } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ClassroomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroom: Classroom | null;
  onSave: (classroom: Classroom) => void;
}

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  capacity: z.coerce.number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(500, "Capacity cannot exceed 500"),
  isLab: z.boolean().default(false)
});

export function ClassroomDialog({
  open,
  onOpenChange,
  classroom,
  onSave,
}: ClassroomDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: classroom?.id || undefined,
      name: classroom?.name || "",
      capacity: classroom?.capacity || 30,
      isLab: classroom?.isLab || false,
    }
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        id: classroom?.id || undefined,
        name: classroom?.name || "",
        capacity: classroom?.capacity || 30,
        isLab: classroom?.isLab || false,
      });
    }
  }, [open, classroom, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values as Classroom);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {classroom ? "Edit Classroom" : "Add Classroom"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Room 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      min={1}
                      max={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isLab"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Laboratory</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Mark this room as a laboratory for practical sessions
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
