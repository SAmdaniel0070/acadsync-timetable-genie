import React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, CheckSquare } from "lucide-react";

interface SelectableDataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    title: string;
    render?: (item: T) => React.ReactNode;
  }[];
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  onBulkDelete?: (items: T[]) => void;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  bulkActions?: React.ReactNode;
}

export function SelectableDataTable<T extends { id: string }>(props: SelectableDataTableProps<T>) {
  const { 
    data, 
    columns, 
    selectedItems,
    onSelectionChange,
    onBulkDelete,
    onRowClick,
    isLoading = false,
    bulkActions
  } = props;

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < data.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter(selected => selected.id !== item.id));
    }
  };

  const isItemSelected = (item: T) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-auto bg-white rounded-md shadow">
        <div className="p-4 flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full overflow-auto bg-white rounded-md shadow">
        <div className="p-4 text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Summary and Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {bulkActions}
              {onBulkDelete && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onBulkDelete(selectedItems)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="w-full overflow-auto bg-white rounded-md shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={isAllSelected || isPartiallySelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all items"
                />
                {isPartiallySelected && (
                  <span className="ml-1 text-xs text-blue-600">
                    ({selectedItems.length})
                  </span>
                )}
              </th>
              {columns.map((column) => (
                <th
                  key={column.key.toString()}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => {
              const isSelected = isItemSelected(item);
              return (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    isSelected && "bg-blue-50 hover:bg-blue-100",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={(e) => {
                    // Don't trigger row click if clicking on checkbox
                    if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                      return;
                    }
                    onRowClick && onRowClick(item);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectItem(item, checked as boolean)}
                      aria-label={`Select item ${item.id}`}
                    />
                  </td>
                  {columns.map((column) => (
                    <td
                      key={`${item.id}-${column.key.toString()}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(item)
                        : item[column.key as keyof T] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}