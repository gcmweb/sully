"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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

function EmbedFormContent() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
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
  const [isInIframe, setIsInIframe] = useState(false);
  
  // Check if running in iframe
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      // If we can't access window.top due to cross-origin restrictions,
      // we're definitely in an iframe
      setIsInIframe(true);
    }
  }, []);
  
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
    
    // Function to update iframe height
    const updateIframeHeight = () => {
      if (isInIframe && formRef.current) {
        // Get the actual content height
        const height = formRef.current.scrollHeight;
        
        // Add a small buffer to prevent scrolling (10px)
        const heightWithBuffer = height + 10;
        
        // Send message to parent window
        try {
          window.parent.postMessage({ 
            type: 'sully-form-resize', 
            height: heightWithBuffer 
          }, '*');
          
          // Also update the document body height to match
          document.body.style.height = `${heightWithBuffer}px`;
          
          console.log('Sent height update:', heightWithBuffer);
        } catch (error) {
          console.error('Error sending height message:', error);
        }
      }
    };
    
    // Update height after initial render and whenever content might change
    if (isMounted && isInIframe) {
      // Initial update with a slight delay to ensure content is rendered
      setTimeout(updateIframeHeight, 100);
      
      // Update when window resizes
      window.addEventListener('resize', updateIframeHeight);
      
      // Update when content changes using MutationObserver
      const observer = new MutationObserver(() => {
        setTimeout(updateIframeHeight, 50);
      });
      
      if (formRef.current) {
        observer.observe(formRef.current, { 
          childList: true, 
          subtree: true, 
          attributes: true,
          characterData: true 
        });
      }
      
      // Listen for height request messages
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'sully-form-height-request') {
          updateIframeHeight();
        }
      });
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', updateIframeHeight);
        observer.disconnect();
      };
    }
  }, [searchParams, isMounted, isInIframe]);
  
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
      className="flex items-center justify-center p-2"
      style={customStyles}
    >
      <style jsx global>{`
        :root {
          --primary: ${formSettings.primaryColor};
          --primary-foreground: white;
        }
        
        html, body {
          background-color: ${formSettings.backgroundColor};
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          height: auto;
        }
        
        /* Compact styles for embedded form */
        .compact-form .space-y-6 {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        
        .compact-form .space-y-4 {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .compact-form .space-y-3 {
          margin-top: 0.375rem;
          margin-bottom: 0.375rem;
        }
        
        .compact-form .space-y-2 {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        
        .compact-form .space-y-1 {
          margin-top: 0.125rem;
          margin-bottom: 0.125rem;
        }
        
        .compact-form h1 {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .compact-form label {
          margin-bottom: 0.25rem;
        }
        
        .compact-form input,
        .compact-form select,
        .compact-form button {
          height: 2.25rem;
          min-height: 2.25rem;
          padding-top: 0.25rem;
          padding-bottom: 0.25rem;
        }
        
        .compact-form textarea {
          min-height: 4rem;
          padding-top: 0.25rem;
          padding-bottom: 0.25rem;
        }
        
        .compact-form .p-6 {
          padding: 1rem;
        }
        
        .compact-form .p-4 {
          padding: 0.75rem;
        }
        
        .compact-form .mb-6 {
          margin-bottom: 0.75rem;
        }
        
        .compact-form .mb-4 {
          margin-bottom: 0.5rem;
        }
        
        .compact-form .mb-3 {
          margin-bottom: 0.375rem;
        }
        
        .compact-form .mb-2 {
          margin-bottom: 0.25rem;
        }
        
        .compact-form .py-10 {
          padding-top: 1.5rem;
          padding-bottom: 1.5rem;
        }
        
        .compact-form .py-6 {
          padding-top: 1rem;
          padding-bottom: 1rem;
        }
        
        .compact-form .gap-4 {
          gap: 0.75rem;
        }
        
        .compact-form .gap-3 {
          gap: 0.5rem;
        }
        
        .compact-form .gap-2 {
          gap: 0.375rem;
        }
        
        .booking-form-container {
          background-color: ${formSettings.backgroundColor};
          color: ${formSettings.textColor};
          border-radius: ${formSettings.borderRadius}px;
          max-width: 100%;
          width: 100%;
          border: none !important;
          box-shadow: none !important;
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
        
        /* Ensure the calendar popover is visible */
        .compact-form [data-radix-popper-content-wrapper] {
          z-index: 9999 !important;
        }
      `}</style>
      
      <div 
        ref={formRef}
        className={`booking-form-container w-full max-w-md p-4 compact-form ${isInIframe ? 'in-iframe' : ''}`}
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
              <h2 className="text-lg font-bold mb-2">{formSettings.successMessage}</h2>
              <p className="text-center mb-4 text-sm">
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
              className="space-y-3"
            >
              {formSettings.showLogo && (
                <div className="flex justify-center mb-3">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-1.5 rounded-md shadow-sm">
                    <Image 
                      src="/image.png" 
                      alt={formSettings.restaurantName} 
                      width={32} 
                      height={32} 
                      className="rounded-sm"
                    />
                  </div>
                </div>
              )}
              
              <h1 className="text-xl font-bold text-center mb-3">{formSettings.formTitle}</h1>
              
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Error</AlertTitle>
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                    <Users className="h-3.5 w-3.5" style={{ color: formSettings.primaryColor }} />
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
                    className="text-sm"
                  />
                </div>
                
                {formSettings.showEmail && (
                  <div className="space-y-1">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5" style={{ color: formSettings.primaryColor }} />
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
                      className="text-sm"
                    />
                  </div>
                )}
                
                {formSettings.showPhone && (
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5" style={{ color: formSettings.primaryColor }} />
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
                      className="text-sm"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="date" className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-3.5 w-3.5" style={{ color: formSettings.primaryColor }} />
                      Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm",
                            !formData.date && "text-muted-foreground"
                          )}
                          style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" style={{ color: formSettings.primaryColor }} />
                          {formData.date ? format(formData.date, "MMM d, yyyy") : <span>Pick a date</span>}
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
                  
                  <div className="space-y-1">
                    <Label htmlFor="time" className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5" style={{ color: formSettings.primaryColor }} />
                      Time
                    </Label>
                    <Select
                      value={formData.time}
                      onValueChange={(value) => handleSelectChange("time", value)}
                      disabled={isCheckingAvailability || availableTimes.length === 0}
                    >
                      <SelectTrigger 
                        className="w-full text-sm"
                        style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                      >
                        <SelectValue placeholder={isCheckingAvailability ? "Checking..." : "Select time"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isCheckingAvailability ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Checking...
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
                
                <div className="space-y-1">
                  <Label htmlFor="partySize" className="flex items-center gap-2 text-sm">
                    <Users className="h-3.5 w-3.5" style={{ color: formSettings.primaryColor }} />
                    Party Size
                  </Label>
                  <Select
                    value={formData.partySize}
                    onValueChange={(value) => handleSelectChange("partySize", value)}
                  >
                    <SelectTrigger 
                      className="w-full text-sm"
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
                  <div className="space-y-1">
                    <Label htmlFor="notes" className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-3.5 w-3.5" style={{ color: formSettings.primaryColor }} />
                      Special Requests
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any special requests or dietary requirements?"
                      rows={2}
                      style={{ backgroundColor: `${formSettings.backgroundColor}dd` }}
                      className="text-sm"
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full btn-primary mt-2"
                  disabled={isSubmitting || isCheckingAvailability}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    formSettings.submitButtonText
                  )}
                </Button>
                
                <p className="text-xs text-center opacity-70 mt-2">
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

export default function EmbedFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <EmbedFormContent />
    </Suspense>
  );
}