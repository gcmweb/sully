"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface TableDialogProps {
  open: boolean;
  onClose: () => void;
  table: any | null;
}

export function TableDialog({ open, onClose, table }: TableDialogProps) {
  const [tableId, setTableId] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("available");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (table) {
      setTableId(table.tableId.toString());
      setCapacity(table.capacity.toString());
      setLocation(table.location);
      setStatus(table.status);
    } else {
      // Reset form for new table
      setTableId("");
      setCapacity("2");
      setLocation("");
      setStatus("available");
    }
  }, [table, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const tableData = {
        tableId: parseInt(tableId),
        capacity: parseInt(capacity),
        location,
        status,
      };
      
      console.log("Submitting table data:", tableData);
      
      let response;
      
      if (table) {
        // Update existing table
        response = await fetch(`/api/tables/${table.tableId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tableData),
        });
      } else {
        // Create new table
        response = await fetch('/api/tables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tableData),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || 'Failed to save table');
      }
      
      const savedTable = await response.json();
      console.log("Table saved successfully:", savedTable);
      
      toast({
        title: table ? "Table updated" : "Table created",
        description: table ? "The table has been updated successfully." : "The table has been created successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving table:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save table",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{table ? "Edit Table" : "Add Table"}</DialogTitle>
            <DialogDescription>
              {table 
                ? "Update the table details below." 
                : "Fill in the details to add a new table."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tableId" className="text-right">
                Table ID
              </Label>
              <Input
                id="tableId"
                type="number"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="col-span-3"
                required
                min="1"
                disabled={!!table}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Select
                value={capacity}
                onValueChange={setCapacity}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select capacity" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} {size === 1 ? "person" : "people"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : table ? "Update Table" : "Add Table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}