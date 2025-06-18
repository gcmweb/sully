"use client";

import { useState, useEffect } from "react";
import { format, addDays, addMinutes, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Info, 
  Users, 
  Utensils, 
  ClipboardCheck, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  booking: any | null;
  onBookingUpdated?: () => void;
}

export function BookingDialog({ open, onClose, booking, onBookingUpdated }: BookingDialogProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("18:00");
  const [customerName, setCustomerName] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [tableId, setTableId] = useState("");
  const [duration, setDuration] = useState("60"); // Default to 1 hour
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [openingHours, setOpeningHours] = useState<any[]>([]);
  const [isLoadingOpeningHours, setIsLoadingOpeningHours] = useState(true);
  const [step, setStep] = useState(1);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTables();
      fetchOpeningHours();
      setStep(1);
      setShowTimeOptions(false);
    }
  }, [open]);

  useEffect(() => {
    if (booking) {
      const bookingDate = new Date(booking.bookingTime);
      setDate(bookingDate);
      setTime(format(bookingDate, "HH:mm"));
      setCustomerName(booking.customerName);
      setPartySize(booking.partySize.toString());
      setTableId(booking.tableId.toString());
      setDuration(booking.duration.toString());
      setNotes(booking.notes || "");
      setStatus(booking.status || "pending");
    } else {
      // Reset form for new booking
      const now = new Date();
      const roundedHour = Math.ceil(now.getHours());
      const defaultTime = roundedHour >= 12 && roundedHour <= 22 
        ? `${roundedHour}:00` 
        : "18:00";
      
      setDate(new Date());
      setTime(defaultTime);
      setCustomerName("");
      setPartySize("2");
      setTableId("");
      setDuration("60"); // Default to 1 hour
      setNotes("");
      setStatus("pending");
    }
    
    // Clear any previous errors
    setDateError(null);
    setTimeError(null);
  }, [booking, open]);

  // When date, time, or duration changes, check availability
  useEffect(() => {
    if (date && time && duration) {
      checkTableAvailability();
    }
  }, [date, time, duration, partySize]);

  const fetchTables = async () => {
    setIsLoadingTables(true);
    try {
      const response = await fetch('/api/tables');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tables. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTables(false);
    }
  };

  const fetchOpeningHours = async () => {
    setIsLoadingOpeningHours(true);
    try {
      const response = await fetch('/api/opening-hours');
      
      if (!response.ok) {
        throw new Error('Failed to fetch opening hours');
      }
      
      const data = await response.json();
      setOpeningHours(data);
    } catch (error) {
      console.error("Error fetching opening hours:", error);
      toast({
        title: "Error",
        description: "Failed to fetch opening hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOpeningHours(false);
    }
  };

  const checkTableAvailability = async () => {
    if (!date || !time || !duration) {
      return;
    }
    
    setIsCheckingAvailability(true);
    try {
      // Format date for API
      const formattedDate = format(date, "yyyy-MM-dd");
      
      // Build URL with query parameters
      const url = `/api/tables/availability?date=${formattedDate}&time=${time}&duration=${duration}&partySize=${partySize}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        if (data.error.includes("outside of opening hours")) {
          setTimeError(data.error);
        } else if (data.error.includes("closed")) {
          setDateError(data.error);
        } else {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
        }
        setAvailableTables([]);
      } else {
        setAvailableTables(data.availableTables);
        setDateError(null);
        setTimeError(null);
        
        // If we're editing a booking, include the current table in available tables
        if (booking && !data.availableTables.some((t: any) => t.tableId === booking.tableId)) {
          const currentTable = tables.find(t => t.tableId === booking.tableId);
          if (currentTable) {
            setAvailableTables([...data.availableTables, currentTable]);
          }
        }
      }
    } catch (error) {
      console.error("Error checking table availability:", error);
      toast({
        title: "Error",
        description: "Failed to check table availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const validateDateTime = () => {
    if (!date) {
      setDateError("Please select a date");
      return false;
    }
    
    const bookingDateTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    
    // If booking is in the past
    if (bookingDateTime < now) {
      setDateError("Booking time cannot be in the past");
      return false;
    }
    
    // Check if the restaurant is open on the selected day
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOpeningHours = openingHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (!dayOpeningHours) {
      setDateError("Opening hours not available for the selected day");
      return false;
    }
    
    if (!dayOpeningHours.isOpen) {
      setDateError("The restaurant is closed on the selected day");
      return false;
    }
    
    // Check if the booking time is within opening hours
    const bookingTimeInMinutes = hours * 60 + minutes;
    const durationMinutes = parseInt(duration);
    
    const [openHour, openMinute] = dayOpeningHours.openTime.split(':').map(Number);
    const openTimeInMinutes = openHour * 60 + openMinute;
    
    const [closeHour, closeMinute] = dayOpeningHours.closeTime.split(':').map(Number);
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    
    if (bookingTimeInMinutes < openTimeInMinutes) {
      setTimeError(`The restaurant opens at ${dayOpeningHours.openTime} on this day`);
      return false;
    }
    
    if (bookingTimeInMinutes + durationMinutes > closeTimeInMinutes) {
      setTimeError(`The booking extends beyond closing time (${dayOpeningHours.closeTime})`);
      return false;
    }
    
    setDateError(null);
    setTimeError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date and time
    if (!validateDateTime()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!date) {
        throw new Error("Please select a date");
      }
      
      if (!tableId) {
        throw new Error("Please select a table");
      }
      
      // Combine date and time
      const bookingDateTime = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);
      
      // Calculate end time
      const endTime = addMinutes(bookingDateTime, parseInt(duration));
      
      const bookingData = {
        customerName,
        partySize,
        tableId,
        bookingTime: bookingDateTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        notes,
        status,
      };
      
      console.log("Submitting booking data:", bookingData);
      
      let response;
      
      if (booking) {
        // Update existing booking
        response = await fetch(`/api/bookings/${booking.bookingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });
      } else {
        // Create new booking
        response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || 'Failed to save booking');
      }
      
      const savedBooking = await response.json();
      console.log("Booking saved successfully:", savedBooking);
      
      toast({
        title: booking ? "Booking updated" : "Booking created",
        description: booking ? "The booking has been updated successfully." : "The booking has been created successfully.",
        className: "toast-purple toast-purple-success",
      });
      
      if (onBookingUpdated) {
        onBookingUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving booking:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save booking",
        variant: "destructive",
        className: "toast-purple toast-purple-error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get opening hours for the selected day
  const getOpeningHoursForSelectedDay = () => {
    if (!date || openingHours.length === 0) return null;
    
    const dayOfWeek = date.getDay();
    return openingHours.find(h => h.dayOfWeek === dayOfWeek);
  };

  const selectedDayHours = getOpeningHoursForSelectedDay();

  // Generate time slots for the selected day
  const generateTimeSlots = () => {
    if (!selectedDayHours || !selectedDayHours.isOpen) return [];
    
    const [openHour, openMinute] = selectedDayHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = selectedDayHours.closeTime.split(':').map(Number);
    
    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    const durationMinutes = parseInt(duration);
    
    // Generate time slots in 30-minute intervals
    const slots = [];
    for (let minutes = openTimeInMinutes; minutes <= closeTimeInMinutes - durationMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const nextStep = () => {
    if (step === 1 && validateDateTime()) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 badge-purple">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 badge-purple">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 badge-purple">
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  // Format end time for display
  const getEndTimeDisplay = () => {
    if (!date || !time) return "";
    
    const bookingDateTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    
    const endTime = addMinutes(bookingDateTime, parseInt(duration));
    return format(endTime, "HH:mm");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-gradient-card shadow-card border-primary/10 rounded-xl responsive-dialog">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-primary/15 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gradient-primary">
                  {booking ? "Edit Booking" : "New Booking"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {booking 
                    ? "Update the booking details below." 
                    : "Fill in the details to create a new booking."}
                </DialogDescription>
              </div>
              {booking && getStatusBadge()}
            </div>
          </DialogHeader>
          
          <div className="px-6 py-4 responsive-dialog-content">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${step === 1 ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <div className={`h-1 w-8 transition-all duration-300 ${step === 1 ? 'bg-primary/50' : 'bg-muted'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${step === 2 ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {step === 1 ? "Date & Time" : "Booking Details"}
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                          Select Date
                        </Label>
                        <div className="flex flex-col">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal transition-all duration-200",
                                  !date && "text-muted-foreground",
                                  dateError ? "border-destructive ring-1 ring-destructive" : "hover:border-primary focus:border-primary"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-primary/20">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                  setDate(newDate);
                                  setDateError(null);
                                }}
                                initialFocus
                                disabled={(date) => {
                                  // Disable dates in the past
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  
                                  if (date < today) return true;
                                  
                                  // Disable days when the restaurant is closed
                                  if (openingHours.length > 0) {
                                    const dayOfWeek = date.getDay();
                                    const dayOpeningHours = openingHours.find(h => h.dayOfWeek === dayOfWeek);
                                    
                                    if (dayOpeningHours && !dayOpeningHours.isOpen) {
                                      return true;
                                    }
                                  }
                                  
                                  return false;
                                }}
                                fromDate={new Date()}
                                toDate={addDays(new Date(), 365)}
                                className="rounded-md border-0"
                              />
                            </PopoverContent>
                          </Popover>
                          {dateError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-destructive mt-1 flex items-center"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {dateError}
                            </motion.p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="time" className="text-sm font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          Select Time
                        </Label>
                        <div className="flex flex-col">
                          <div className="relative">
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-between text-left font-normal transition-all duration-200",
                                timeError ? "border-destructive ring-1 ring-destructive" : "hover:border-primary focus:border-primary"
                              )}
                              onClick={() => setShowTimeOptions(!showTimeOptions)}
                            >
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-primary" />
                                {time} - {getEndTimeDisplay()}
                              </div>
                              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${showTimeOptions ? 'rotate-90' : ''}`} />
                            </Button>
                            
                            <AnimatePresence>
                              {showTimeOptions && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute z-10 mt-1 w-full bg-popover rounded-md border border-border shadow-md max-h-60 overflow-auto"
                                >
                                  {timeSlots.length > 0 ? (
                                    <div className="p-2 grid grid-cols-3 gap-1">
                                      {timeSlots.map((slot) => (
                                        <Button
                                          key={slot}
                                          type="button"
                                          variant={time === slot ? "default" : "ghost"}
                                          size="sm"
                                          className={cn(
                                            "justify-center",
                                            time === slot && "bg-primary text-primary-foreground"
                                          )}
                                          onClick={() => {
                                            setTime(slot);
                                            setTimeError(null);
                                            setShowTimeOptions(false);
                                          }}
                                        >
                                          {slot}
                                        </Button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      No available time slots for this day
                                    </div>
                                  )}
                                  
                                  <div className="p-2 border-t">
                                    <div className="flex items-center">
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Or enter a custom time:</p>
                                      </div>
                                      <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => {
                                          setTime(e.target.value);
                                          setTimeError(null);
                                        }}
                                        className="w-24 text-xs"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          {timeError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-destructive mt-1 flex items-center"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {timeError}
                            </motion.p>
                          )}
                          {selectedDayHours && selectedDayHours.isOpen && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                              <Info className="h-3 w-3 mr-1" />
                              Opening hours: {selectedDayHours.openTime} - {selectedDayHours.closeTime}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-sm font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          Duration
                        </Label>
                        <Select
                          value={duration}
                          onValueChange={(value) => {
                            setDuration(value);
                            setTimeError(null);
                          }}
                        >
                          <SelectTrigger className={cn(
                            "transition-all duration-200",
                            "hover:border-primary focus:border-primary"
                          )}>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="150">2.5 hours</SelectItem>
                            <SelectItem value="180">3 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Alert className="bg-info/10 border-info/20 text-info">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Booking Information</AlertTitle>
                      <AlertDescription>
                        Tables are only reserved for the duration of your booking. You can book a table even if it has other bookings on the same day, as long as the time slots don't overlap.
                      </AlertDescription>
                    </Alert>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName" className="text-sm font-medium flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          Customer Name
                        </Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="transition-all duration-200 hover:border-primary focus:border-primary"
                          placeholder="Enter customer name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="partySize" className="text-sm font-medium flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          Party Size
                        </Label>
                        <Select
                          value={partySize}
                          onValueChange={setPartySize}
                        >
                          <SelectTrigger className="transition-all duration-200 hover:border-primary focus:border-primary">
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="tableId" className="text-sm font-medium flex items-center">
                          <Utensils className="h-4 w-4 mr-2 text-primary" />
                          Table
                        </Label>
                        <Select
                          value={tableId}
                          onValueChange={setTableId}
                        >
                          <SelectTrigger className="transition-all duration-200 hover:border-primary focus:border-primary">
                            <SelectValue placeholder={isCheckingAvailability ? "Checking availability..." : "Select a table"} />
                          </SelectTrigger>
                          <SelectContent>
                            {isCheckingAvailability ? (
                              <SelectItem value="loading" disabled>Checking availability...</SelectItem>
                            ) : availableTables.length === 0 ? (
                              <SelectItem value="none" disabled>No available tables for this time slot</SelectItem>
                            ) : (
                              availableTables.map((table) => (
                                <SelectItem key={table.id} value={table.tableId.toString()}>
                                  Table {table.tableId} ({table.capacity} seats, {table.location})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                          <Info className="h-3 w-3 mr-1" />
                          {availableTables.length} tables available for this time slot
                        </p>
                      </div>
                      
                      {booking && (
                        <div className="space-y-2">
                          <Label htmlFor="status" className="text-sm font-medium flex items-center">
                            <ClipboardCheck className="h-4 w-4 mr-2 text-primary" />
                            Status
                          </Label>
                          <Select
                            value={status}
                            onValueChange={setStatus}
                          >
                            <SelectTrigger className="transition-all duration-200 hover:border-primary focus:border-primary">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium flex items-center">
                          <ClipboardCheck className="h-4 w-4 mr-2 text-primary" />
                          Notes
                        </Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="transition-all duration-200 hover:border-primary focus:border-primary"
                          placeholder="Special requests or additional information"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <DialogFooter className="p-6 pt-2 border-t bg-muted/30">
            {step === 1 ? (
              <div className="flex justify-between w-full">
                <Button type="button" variant="outline" onClick={onClose} className="transition-all duration-200">
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  disabled={!date || !!dateError || !!timeError}
                  className="btn-purple flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-between w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  className="transition-all duration-200 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !tableId || !customerName}
                  className="btn-purple"
                >
                  {isSubmitting ? "Saving..." : booking ? "Update Booking" : "Create Booking"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}