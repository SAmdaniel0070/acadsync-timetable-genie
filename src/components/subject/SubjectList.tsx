
import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Calendar, Users } from "lucide-react";
import { Subject, Class } from "@/types";

interface SubjectListProps {
  subjects: Subject[];
  classes: Class[];
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
  onManageLabs: (subject: Subject) => void;
  onManageTeachers: (subject: Subject) => void;
}

export const SubjectList = ({
  subjects,
  classes,
  onEdit,
  onDelete,
  onManageLabs,
  onManageTeachers,
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
      key: "periodsPerWeek",
      title: "Periods/Week",
      render: (subject: Subject) => (
        <span>{subject.periodsPerWeek || 1}</span>
      ),
    },
    {
      key: "isLab",
      title: "Type",
      render: (subject: Subject) => (
        <div className="flex gap-1">
          <Badge variant="outline">Theory</Badge>
          {subject.isLab && (
            <Badge variant="secondary">
              Lab ({subject.lab_duration_hours || 2}h)
            </Badge>
          )}
        </div>
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
            onClick={() => onManageTeachers(subject)}
            title="Assign Teachers to Batches"
          >
            <Users className="h-4 w-4" />
          </Button>
          {subject.isLab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageLabs(subject)}
              title="Manage Lab Schedules"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          )}
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
