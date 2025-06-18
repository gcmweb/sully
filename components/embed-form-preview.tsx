"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Mail, 
  Phone, 
  MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmbedFormPreviewProps {
  settings: any;
}

export function EmbedFormPreview({ settings }: EmbedFormPreviewProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    partySize: "2",
    notes: "",
  });
  
  // Apply custom styles based on form settings
  const customStyles = {
    backgroundColor: settings.backgroundColor,
    color: settings.textColor,
    height: "100%",
    width: "100%",
    overflow: "auto",
    padding: "1.5rem",
    "--primary-color": settings.primaryColor,
  } as React.CSSProperties;
  
  return (
    <div style={customStyles}>
      <style jsx global>{`
        .preview-form-container {
          background-color: ${settings.backgroundColor};
          color: ${settings.textColor};
        }
        
        .preview-form-container .btn-primary {
          background-color: ${settings.primaryColor};
          color: white;
        }
        
        .preview-form-container input,
        .preview-form-container textarea,
        .preview-form-container select,
        .preview-form-container button {
          border-color: ${settings.primaryColor}33;
          background-color: ${settings.backgroundColor}dd;
        }
      `}</style>
      
      <div className="preview-form-container space-y-6">
        {settings.showLogo && (
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-2 rounded-md shadow-sm">
              <Image 
                src="/image.png" 
                alt={settings.restaurantName} 
                width={40} 
                height={40} 
                className="rounded-sm"
              />
            </div>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-center mb-6">{settings.formTitle}</h1>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preview-name" className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: settings.primaryColor }} />
              Your Name
            </Label>
            <Input
              id="preview-name"
              placeholder="Enter your name"
              style={{ backgroundColor: `${settings.backgroundColor}dd` }}
            />
          </div>
          
          {settings.showEmail && (
            <div className="space-y-2">
              <Label htmlFor="preview-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: settings.primaryColor }} />
                Email Address
              </Label>
              <Input
                id="preview-email"
                type="email"
                placeholder="Enter your email"
                style={{ backgroundColor: `${settings.backgroundColor}dd` }}
              />
            </div>
          )}
          
          {settings.showPhone && (
            <div className="space-y-2">
              <Label htmlFor="preview-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" style={{ color: settings.primaryColor }} />
                Phone Number
              </Label>
              <Input
                id="preview-phone"
                placeholder="Enter your phone number"
                style={{ backgroundColor: `${settings.backgroundColor}dd` }}
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preview-date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" style={{ color: settings.primaryColor }} />
                Date
              </Label>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
                style={{ backgroundColor: `${settings.backgroundColor}dd` }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" style={{ color: settings.primaryColor }} />
                <span className="text-muted-foreground">Pick a date</span>
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preview-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: settings.primaryColor }} />
                Time
              </Label>
              <Select>
                <SelectTrigger 
                  className="w-full"
                  style={{ backgroundColor: `${settings.backgroundColor}dd` }}
                >
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18:00">18:00</SelectItem>
                  <SelectItem value="18:30">18:30</SelectItem>
                  <SelectItem value="19:00">19:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preview-party-size" className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: settings.primaryColor }} />
              Party Size
            </Label>
            <Select defaultValue="2">
              <SelectTrigger 
                className="w-full"
                style={{ backgroundColor: `${settings.backgroundColor}dd` }}
              >
                <SelectValue placeholder="Select party size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 person</SelectItem>
                <SelectItem value="2">2 people</SelectItem>
                <SelectItem value="4">4 people</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {settings.showNotes && (
            <div className="space-y-2">
              <Label htmlFor="preview-notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: settings.primaryColor }} />
                Special Requests
              </Label>
              <Textarea
                id="preview-notes"
                placeholder="Any special requests or dietary requirements?"
                rows={3}
                style={{ backgroundColor: `${settings.backgroundColor}dd` }}
              />
            </div>
          )}
          
          <Button 
            className="w-full btn-primary"
          >
            {settings.submitButtonText}
          </Button>
          
          <p className="text-xs text-center opacity-70 mt-4">
            Powered by Sully Booking System
          </p>
        </div>
      </div>
    </div>
  );
}