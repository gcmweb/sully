"use client";

import { useState } from "react";
import { Clock, Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OpeningHoursEditorProps {
  openingHours: any[];
  onChange: (hours: any[]) => void;
}

export function OpeningHoursEditor({ openingHours, onChange }: OpeningHoursEditorProps) {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const handleIsOpenChange = (dayOfWeek: number, isOpen: boolean) => {
    const updatedHours = openingHours.map(hours => {
      if (hours.dayOfWeek === dayOfWeek) {
        return { ...hours, isOpen };
      }
      return hours;
    });
    
    onChange(updatedHours);
  };

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    const updatedHours = openingHours.map(hours => {
      if (hours.dayOfWeek === dayOfWeek) {
        return { ...hours, [field]: value };
      }
      return hours;
    });
    
    onChange(updatedHours);
  };

  // Sort opening hours by day of week
  const sortedHours = [...openingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 font-medium text-sm text-muted-foreground mb-2">
        <div>Day</div>
        <div>Open</div>
        <div>Opening Time</div>
        <div>Closing Time</div>
      </div>
      
      {sortedHours.map((hours) => (
        <div 
          key={hours.dayOfWeek} 
          className={cn(
            "grid grid-cols-4 gap-4 items-center p-4 rounded-md",
            hours.isOpen ? "bg-muted/30" : "bg-muted/10"
          )}
        >
          <div className="font-medium">{dayNames[hours.dayOfWeek]}</div>
          
          <div className="flex items-center gap-2">
            <Switch 
              checked={hours.isOpen} 
              onCheckedChange={(checked) => handleIsOpenChange(hours.dayOfWeek, checked)}
            />
            <span className="text-sm">
              {hours.isOpen ? (
                <span className="flex items-center text-green-600 dark:text-green-500">
                  <Check className="h-4 w-4 mr-1" />
                  Open
                </span>
              ) : (
                <span className="flex items-center text-red-600 dark:text-red-500">
                  <X className="h-4 w-4 mr-1" />
                  Closed
                </span>
              )}
            </span>
          </div>
          
          <div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input 
                type="time" 
                value={hours.openTime} 
                onChange={(e) => handleTimeChange(hours.dayOfWeek, 'openTime', e.target.value)}
                disabled={!hours.isOpen}
                className={!hours.isOpen ? "opacity-50" : ""}
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input 
                type="time" 
                value={hours.closeTime} 
                onChange={(e) => handleTimeChange(hours.dayOfWeek, 'closeTime', e.target.value)}
                disabled={!hours.isOpen}
                className={!hours.isOpen ? "opacity-50" : ""}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}