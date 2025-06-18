"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function BookingFormContent() {
  const searchParams = useSearchParams();
  const [formSettings, setFormSettings] = useState({
    primaryColor: "#8A2BE2", // Default purple
    backgroundColor: "#2A2A2A", // Default dark grey
    textColor: "#FFFFFF", // Default white
    borderRadius: 8,
    showLogo: true,
    showEmail: true,
    showPhone: true,
    showNotes: true,
    formTitle: "Book a Table",
    submitButtonText: "Make Reservation",
    successMessage: "Your booking has been submitted successfully!",
    restaurantName: "Sully Restaurant",
  });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: new Date(),
    time: "18:00",
    partySize: "2",
    notes: "",
  });
  
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  // Parse search params to get form settings
  useEffect(() => {
    setIsMounted(true);
    
    if (searchParams) {
      const newSettings = { ...formSettings };
      
      // Parse all possible settings from URL
      searchParams.forEach((value, key) => {
        if (key in newSettings) {
          // Handle boolean values
          if (value === "true" || value === "false") {
            (newSettings as any)[key] = value === "true";
          } 
          // Handle numeric values
          else if (!isNaN(Number(value)) && key !== "formTitle" && key !== "submitButtonText" && key !== "successMessage" && key !== "restaurantName") {
            (newSettings as any)[key] = Number(value);
          }
          // Handle string values
          else {
            (newSettings as any)[key] = value;
          }
        }
      });
      
      setFormSettings(newSettings);
    }
  }, [searchParams]);
  
  // Generate available times when date changes
  useEffect(() => {
    if (formData.date) {
      generateAvailableTimes();
    }
  }, [formData.date]);
  
  const generateAvailableTimes = async () => {
    setIsCheckingAvailability(true);
    try {
      // Format date for API
      const formattedDate = format(formData.date, "yyyy-MM-dd");
      
      // Fetch available times from API
      const response = await fetch(`/api/tables/availability/times?date=${formattedDate}&partySize=${formData.partySize}`);
      const data = await response.json();
      
      if (data.error) {
        setAvailableTimes([]);
        setError(data.error);
      } else {
        setAvailableTimes(data.availableTimes || []);
        setError(null);
        
        // If current selected time is not available, reset it
        if (data.availableTimes && data.availableTimes.length > 0 && !data.availableTimes.includes(formData.time)) {
          setFormData(prev => ({ ...prev, time: data.availableTimes[0] }));
        }
      }
    } catch (error) {
      console.error("Error fetching available times:", error);
      setAvailableTimes([]);
      setError("Failed to fetch available times. Please try again.");
    } finally {
      setIsCheckingAvailability(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, date }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.name) {
        throw new Error("Please enter your name");
      }
      
      if (formSettings.showEmail && !formData.email) {
        throw new Error("Please enter your email address");
      }
      
      if (formSettings.showPhone && !formData.phone) {
        throw new Error("Please enter your phone number");
      }
      
      if (!formData.date) {
        throw new Error("Please select a date");
      }
      
      if (!formData.time) {
        throw new Error("Please select a time");
      }
      
      if (!formData.partySize) {
        throw new Error("Please select a party size");
      }
      
      // Combine date and time
      const bookingDateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(":").map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);
      
      // Submit booking to API
      const response = await fetch('/api/bookings/external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.name,
          email: formData.email,
          phone: formData.phone,
          partySize: parseInt(formData.partySize),
          bookingTime: bookingDateTime.toISOString(),
          duration: 120, // Default to 2 hours
          notes: formData.notes,
          source: "embedded_form",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      // Show success message
      setIsSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
          date: new Date(),
          time: "18:00",
          partySize: "2",
          notes: "",
        });
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error submitting booking:", error);
      setError(error instanceof Error ? error.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Apply custom styles based on form settings
  const customStyles = {
    backgroundColor: formSettings.backgroundColor,
    color: formSettings.textColor,
    borderRadius: `${formSettings.borderRadius}px`,
    "--primary-color": formSettings.primaryColor,
  } as React.CSSProperties;
  
  // Don't render until client-side
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={customStyles}
    >
      <style jsx global>{`
        :root {
          --primary: ${formSettings.primaryColor};
          --primary-foreground: white;
        }
        
        .booking-form-container {
          background-color: ${formSettings.backgroundColor};
          color: ${formSettings.textColor};
          border-radius: ${formSettings.borderRadius}px;
          max-width: 100%;
          width: 100%;
        }
        
        .booking-form-container .btn-primary {
          background-color: ${formSettings.primaryColor};
          color: white;
        }
        
        .booking-form-container .btn-primary:hover {
          background-color: ${formSettings.primaryColor}dd;
        }
        
        .booking-form-container input,
        .booking-form-container textarea,
        .booking-form-container select,
        .booking-form-container button {
          border-color: ${formSettings.primaryColor}33;
        }
        
        .booking-form-container input:focus,
        .booking-form-container textarea:focus,
        .booking-form-container select:focus {
          border-color: ${formSettings.primaryColor};
          box-shadow: 0 0 0 1px ${formSettings.primaryColor}33;
        }
      `}</style>
      
      <div className="booking-form-container w-full max-w-md p-6 border shadow-lg">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">{formSettings.successMessage}</h2>
              <p className="text-center mb-6">
                We look forward to welcoming you to {formSettings.restaurantName}.
              </p>
              <Button 
                onClick={() => setIsSuccess(false)}
                className="btn-primary"
              >
                Make Another Booking
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {formSettings.showLogo && (
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-2 rounded-md shadow-sm">
                    <Image 
                      src="/image.png" 
                      alt={formSettings.restaurantName} 
                      width={40} 
                      height={40} 
                      className="rounded-sm"
                    />
                  </div>
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-center mb-6">{formSettings.formTitle}</h1>
              
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: formSettings.primaryColor }} />
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                    style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                  />
                </div>
                
                {formSettings.showEmail && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" style={{ color: formSettings.primaryColor }} />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                    />
                  </div>
                )}
                
                {formSettings.showPhone && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" style={{ color: formSettings.primaryColor }} />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      required
                      style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" style={{ color: formSettings.primaryColor }} />
                      Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                          style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" style={{ color: formSettings.primaryColor }} />
                          {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={handleDateChange}
                          initialFocus
                          disabled={(date) => {
                            // Disable dates in the past
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          fromDate={new Date()}
                          toDate={addDays(new Date(), 90)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" style={{ color: formSettings.primaryColor }} />
                      Time
                    </Label>
                    <Select
                      value={formData.time}
                      onValueChange={(value) => handleSelectChange("time", value)}
                      disabled={isCheckingAvailability || availableTimes.length === 0}
                    >
                      <SelectTrigger 
                        className="w-full"
                        style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                      >
                        <SelectValue placeholder={isCheckingAvailability ? "Checking..." : "Select time"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isCheckingAvailability ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Checking availability...
                            </div>
                          </SelectItem>
                        ) : availableTimes.length === 0 ? (
                          <SelectItem value="none" disabled>No available times</SelectItem>
                        ) : (
                          availableTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="partySize" className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: formSettings.primaryColor }} />
                    Party Size
                  </Label>
                  <Select
                    value={formData.partySize}
                    onValueChange={(value) => handleSelectChange("partySize", value)}
                  >
                    <SelectTrigger 
                      className="w-full"
                      style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                    >
                      <SelectValue placeholder="Select party size" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} {size === 1 ? "person" : "people"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {formSettings.showNotes && (
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" style={{ color: formSettings.primaryColor }} />
                      Special Requests
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any special requests or dietary requirements?"
                      rows={3}
                      style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={isSubmitting || isCheckingAvailability}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    formSettings.submitButtonText
                  )}
                </Button>
                
                <p className="text-xs text-center opacity-70 mt-4">
                  Powered by Sully Booking System
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function BookingFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingFormContent />
    </Suspense>
  );
}