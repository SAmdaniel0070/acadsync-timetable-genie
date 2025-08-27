
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Edit, MailIcon, Share2, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditMode } from "@/types";
import { TimetableDrafts } from "./TimetableDrafts";

interface TimetableActionsProps {
  onGenerate: () => void;
  onDownload: (format: string) => void;
  onShareEmail: () => void;
  onShareWhatsApp: () => void;
  editMode: EditMode;
  toggleEditMode: () => void;
  currentTimetableData?: any;
  onLoadDraft: (draftData: any) => void;
}

export const TimetableActions: React.FC<TimetableActionsProps> = ({
  onGenerate,
  onDownload,
  onShareEmail,
  onShareWhatsApp,
  editMode,
  toggleEditMode,
  currentTimetableData,
  onLoadDraft,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch 
          id="edit-mode" 
          checked={editMode === "edit"}
          onCheckedChange={toggleEditMode}
        />
        <Label htmlFor="edit-mode" className="cursor-pointer">
          {editMode === "edit" ? (
            <span className="flex items-center text-brand-600">
              <Edit className="mr-1 h-4 w-4" />
              Editing Mode
            </span>
          ) : (
            "Enable Editing Mode"
          )}
        </Label>
      </div>

      <div className="flex flex-wrap gap-2">
        <TimetableDrafts 
          currentTimetableData={currentTimetableData}
          onLoadDraft={onLoadDraft}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onDownload('pdf')}>
              Download as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload('excel')}>
              Download as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload('csv')}>
              Download as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload('html')}>
              Download as HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={onShareEmail}>
          <MailIcon className="mr-2 h-4 w-4" />
          Email
        </Button>
        <Button variant="outline" onClick={onShareWhatsApp}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Button onClick={onGenerate}>
          Generate Timetable
        </Button>
      </div>
    </div>
  );
};
