
import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Subject, Class } from "@/types";

interface SubjectListProps {
  subjects: Subject[];
  classes: Class[];
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

export const SubjectList = ({
  subjects,
  classes,
  onEdit,
  onDelete,
}: SubjectListProps) => {
  const columns = [
    { key: "name", title: "Name" },
    { key: "code", title: "Code" },
    {
      key: "classes",
      title: "Assigned Classes",
      render: (subject: Subject) => (
        <span>
          {subject.classes
            ?.map(
              (classId) =>
                classes.find((c) => c.id === classId)?.name || "Unknown"
            )
            .join(", ") || "None"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (subject: Subject) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(subject)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(subject)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable data={subjects} columns={columns} />;
};
