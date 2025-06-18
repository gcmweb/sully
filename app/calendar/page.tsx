"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval, addMinutes, subDays } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  Calendar as CalendarIcon,
  Info,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Smartphone,
  Laptop,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/date-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { BookingDialog } from "@/components/booking-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isMounted, setIsMounted] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "day" | "list">("week");
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      
      // Default to day view on mobile
      if (window.innerWidth < 768 && viewMode === "week") {
        setViewMode("day");
      }
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchBookings();
    }
  }, [weekStartDate, isMounted, viewMode, selectedDate]);

  const fetchBookings = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      // Calculate the date range based on view mode
      let startDateStr, endDateStr;
      
      if (viewMode === "week") {
        // For week view, fetch the entire week
        const weekEndDate = addDays(weekStartDate, 6);
        startDateStr = weekStartDate.toISOString();
        endDateStr = weekEndDate.toISOString();
        
        console.log(`[Calendar] Fetching confirmed bookings for week: ${format(weekStartDate, 'yyyy-MM-dd')} to ${format(weekEndDate, 'yyyy-MM-dd')}`);
      } else if (viewMode === "day" && selectedDate) {
        // For day view, fetch just the selected day
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        startDateStr = dayStart.toISOString();
        endDateStr = dayEnd.toISOString();
        
        console.log(`[Calendar] Fetching confirmed bookings for day: ${format(dayStart, 'yyyy-MM-dd')}`);
      } else {
        // Default to current week if something goes wrong
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        
        startDateStr = weekStart.toISOString();
        endDateStr = weekEnd.toISOString();
        
        console.log(`[Calendar] Fetching confirmed bookings with default range: ${format(weekStart, 'yyyy-MM-dd')} to ${format(weekEnd, 'yyyy-MM-dd')}`);
      }
      
      // Construct the API URL with date range parameters and status=confirmed
      const url = `/api/bookings?startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}&status=confirmed`;
      console.log(`[Calendar] API request URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Calendar] API error response:", errorData);
        throw new Error(errorData.error || 'Failed to fetch bookings');
      }
      
      const data = await response.json();
      console.log(`[Calendar] Fetched ${data.length} confirmed bookings:`, data);
      
      // Verify the data structure
      if (!Array.isArray(data)) {
        console.error("[Calendar] API returned non-array data:", data);
        throw new Error("Invalid data format received from API");
      }
      
      // Check if bookings have the expected properties
      if (data.length > 0) {
        const sampleBooking = data[0];
        console.log("[Calendar] Sample booking structure:", sampleBooking);
        
        if (!sampleBooking.bookingTime || !sampleBooking.endTime) {
          console.warn("[Calendar] Bookings may be missing required time fields");
        }
      }
      
      setBookings(data);
    } catch (error) {
      console.error("[Calendar] Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch confirmed bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Generate time slots from 12:00 to 23:00
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 12;
    return `${hour}:00`;
  });

  // Navigate to previous week/day
  const navigatePrevious = () => {
    if (viewMode === "week") {
      setWeekStartDate(addDays(weekStartDate, -7));
    } else if (viewMode === "day" && selectedDate) {
      const newDate = subDays(selectedDate, 1);
      setSelectedDate(newDate);
    }
  };

  // Navigate to next week/day
  const navigateNext = () => {
    if (viewMode === "week") {
      setWeekStartDate(addDays(weekStartDate, 7));
    } else if (viewMode === "day" && selectedDate) {
      const newDate = addDays(selectedDate, 1);
      setSelectedDate(newDate);
    }
  };

  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    setWeekStartDate(startOfWeek(today, { weekStartsOn: 1 }));
    setSelectedDate(today);
  };

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  // Get bookings for a specific day and time
  const getBookingsForTimeSlot = (day: Date, timeSlot: string) => {
    const hour = parseInt(timeSlot.split(':')[0]);
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    // Log the time slot we're checking
    // console.log(`[Calendar] Checking time slot: ${format(slotStart, 'yyyy-MM-dd HH:mm')} - ${format(slotEnd, 'HH:mm')}`);
    
    return bookings.filter(booking => {
      try {
        const bookingStart = new Date(booking.bookingTime);
        const bookingEnd = new Date(booking.endTime);
        
        // Check if booking overlaps with this time slot
        const overlaps = (
          (bookingStart < slotEnd && bookingEnd > slotStart) &&
          isSameDay(bookingStart, day)
        );
        
        // if (overlaps) {
        //   console.log(`[Calendar] Found booking: ${booking.customerName} at ${format(bookingStart, 'HH:mm')} - ${format(bookingEnd, 'HH:mm')}`);
        // }
        
        return overlaps;
      } catch (error) {
        console.error(`[Calendar] Error processing booking for time slot:`, error, booking);
        return false;
      }
    });
  };

  // Get color based on booking status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 border-success/30 text-white";
      case "pending":
        return "bg-warning/10 border-warning/30 text-white";
      case "cancelled":
        return "bg-destructive/10 border-destructive/30 text-white";
      default:
        return "bg-muted/30 border-muted/50 text-white";
    }
  };

  // Handle booking click
  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedBooking(null);
  };

  // Handle booking updated
  const handleBookingUpdated = () => {
    fetchBookings();
  };

  // Get bookings for a specific day (for day view)
  const getBookingsForDay = (day: Date) => {
    return bookings.filter(booking => {
      try {
        const bookingDate = new Date(booking.bookingTime);
        return isSameDay(bookingDate, day);
      } catch (error) {
        console.error(`[Calendar] Error filtering booking for day:`, error, booking);
        return false;
      }
    }).sort((a, b) => {
      return new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime();
    });
  };

  // Don't render animations until client-side
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Weekly Schedule</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                  Loading...
                </div>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              View and manage confirmed bookings for the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p>Loading calendar...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Calendar</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker date={selectedDate} setDate={(date) => {
            setSelectedDate(date);
            if (date) {
              setWeekStartDate(startOfWeek(date, { weekStartsOn: 1 }));
            }
          }} />
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={goToToday}
          >
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={fetchBookings}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Tabs 
          defaultValue={isMobile ? "day" : "week"} 
          value={viewMode} 
          onValueChange={(value) => setViewMode(value as "week" | "day" | "list")}
          className="w-auto"
        >
          <TabsList className="grid grid-cols-3 w-[300px]">
            <TabsTrigger value="week" className="flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              Week
            </TabsTrigger>
            <TabsTrigger value="day" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Day
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium text-white">
            {viewMode === "week" ? (
              <span>{format(weekStartDate, "MMM d")} - {format(addDays(weekStartDate, 6), "MMM d, yyyy")}</span>
            ) : viewMode === "day" && selectedDate ? (
              <span>{format(selectedDate, "MMMM d, yyyy")}</span>
            ) : (
              <span>All Confirmed Bookings</span>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-card shadow-card border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white">
            {viewMode === "week" ? "Weekly Schedule" : 
             viewMode === "day" ? `Bookings for ${selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"}` :
             "All Confirmed Bookings"}
          </CardTitle>
          <CardDescription>
            {viewMode === "week" ? "View and manage confirmed bookings for the week" : 
             viewMode === "day" ? "View and manage confirmed bookings for the selected day" :
             "View all confirmed bookings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <motion.div
              ref={ref}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={viewMode === "week" ? "overflow-x-auto" : ""}
            >
              {/* Week View */}
              {viewMode === "week" && (
                <div className="min-w-[800px]">
                  {/* Calendar header */}
                  <div className="grid grid-cols-8 gap-1 mb-1">
                    <div className="p-2 font-medium text-center bg-primary/20 rounded-md text-white">Time</div>
                    {weekDays.map((day, index) => (
                      <div 
                        key={index} 
                        className={`p-2 font-medium text-center rounded-md ${
                          isSameDay(day, new Date()) ? "bg-primary/30 text-white" : "bg-primary/10 text-white"
                        }`}
                      >
                        <div>{format(day, "EEE")}</div>
                        <div>{format(day, "MMM d")}</div>
                      </div>
                    ))}
                  </div>

                  {/* Calendar body */}
                  {timeSlots.map((timeSlot, timeIndex) => (
                    <div key={timeIndex} className="grid grid-cols-8 gap-1 mb-1">
                      <div className="p-2 text-center bg-primary/20 rounded-md flex items-center justify-center text-white">
                        <Clock className="h-4 w-4 mr-1 text-primary" />
                        {timeSlot}
                      </div>
                      {weekDays.map((day, dayIndex) => {
                        const bookingsForSlot = getBookingsForTimeSlot(day, timeSlot);
                        return (
                          <div 
                            key={dayIndex} 
                            className={cn(
                              "p-2 rounded-md min-h-[80px] transition-all duration-200",
                              bookingsForSlot.length > 0 
                                ? "bg-background border border-primary/20 shadow-sm" 
                                : isSameDay(day, new Date())
                                  ? "bg-primary/5 border border-primary/10"
                                  : "bg-muted/10"
                            )}
                          >
                            {bookingsForSlot.map((booking) => (
                              <TooltipProvider key={booking.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <motion.div 
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className={`mb-1 p-1.5 text-xs rounded-md border ${getStatusColor(booking.status)} cursor-pointer hover:opacity-80 transition-opacity shadow-sm hover:shadow-md`}
                                      onClick={() => handleBookingClick(booking)}
                                    >
                                      <div className="font-medium">{booking.customerName}</div>
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-primary" />
                                        {booking.partySize} | Table {booking.tableId}
                                      </div>
                                      <div className="flex items-center gap-1 text-xs">
                                        <Clock className="h-3 w-3 text-primary" />
                                        {format(new Date(booking.bookingTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                                      </div>
                                    </motion.div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-card border-primary/20 z-50">
                                    <div className="space-y-1">
                                      <div className="font-medium">{booking.customerName}</div>
                                      <div className="text-xs">Table {booking.tableId}</div>
                                      <div className="text-xs">Party size: {booking.partySize}</div>
                                      <div className="text-xs">Time: {format(new Date(booking.bookingTime), "p")}</div>
                                      <div className="text-xs">Duration: {booking.duration} min</div>
                                      <div className="text-xs flex items-center gap-1">
                                        Status: 
                                        <Badge variant="outline" className="bg-success/20 text-success">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          confirmed
                                        </Badge>
                                      </div>
                                      {booking.notes && (
                                        <div className="text-xs">Notes: {booking.notes}</div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Day View */}
              {viewMode === "day" && selectedDate && (
                <div className="space-y-4">
                  {timeSlots.map((timeSlot, timeIndex) => {
                    const bookingsForSlot = getBookingsForTimeSlot(selectedDate, timeSlot);
                    if (bookingsForSlot.length === 0) return null;
                    
                    return (
                      <div key={timeIndex} className="rounded-md overflow-hidden">
                        <div className="bg-primary/20 p-2 font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          {timeSlot}
                        </div>
                        <div className="space-y-2 p-2 bg-background/50">
                          {bookingsForSlot.map((booking) => (
                            <motion.div
                              key={booking.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                              className={`p-3 rounded-md border ${getStatusColor(booking.status)} cursor-pointer hover:opacity-90 transition-all shadow-sm hover:shadow-md`}
                              onClick={() => handleBookingClick(booking)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-white">{booking.customerName}</h3>
                                  <div className="flex flex-wrap gap-4 mt-1 text-sm">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-primary" />
                                      {format(new Date(booking.bookingTime), "p")} - {format(new Date(booking.endTime), "p")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4 text-primary" />
                                      {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="h-4 w-4 text-primary" />
                                      Table {booking.tableId}
                                    </div>
                                  </div>
                                  {booking.notes && (
                                    <div className="mt-2 text-sm flex items-start gap-1">
                                      <Info className="h-4 w-4 mt-0.5 text-primary" />
                                      {booking.notes}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="outline" className="bg-success/20 text-success">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  confirmed
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {getBookingsForDay(selectedDate).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <h3 className="text-lg font-medium text-white">No confirmed bookings for this day</h3>
                      <p className="text-sm mt-1">
                        There are no confirmed reservations scheduled for {format(selectedDate, "MMMM d, yyyy")}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="space-y-4">
                  {bookings.length > 0 ? (
                    bookings
                      .sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime())
                      .map(booking => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`p-4 rounded-lg border ${getStatusColor(booking.status)} cursor-pointer hover:opacity-90 transition-all shadow-sm hover:shadow-md`}
                          onClick={() => handleBookingClick(booking)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white">{booking.customerName}</h3>
                              <div className="flex flex-wrap gap-4 mt-1 text-sm">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4 text-primary" />
                                  {format(new Date(booking.bookingTime), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-primary" />
                                  {format(new Date(booking.bookingTime), "p")} - {format(new Date(booking.endTime), "p")}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4 text-primary" />
                                  {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4 text-primary" />
                                  Table {booking.tableId}
                                </div>
                              </div>
                              {booking.notes && (
                                <div className="mt-2 text-sm flex items-start gap-1">
                                  <Info className="h-4 w-4 mt-0.5 text-primary" />
                                  {booking.notes}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-success/20 text-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              confirmed
                            </Badge>
                          </div>
                        </motion.div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <h3 className="text-lg font-medium text-white">No confirmed bookings found</h3>
                      <p className="text-sm mt-1">
                        There are no confirmed reservations scheduled for the selected period.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <BookingDialog 
        open={isDialogOpen} 
        onClose={handleDialogClose} 
        booking={selectedBooking}
        onBookingUpdated={handleBookingUpdated}
      />
    </div>
  );
}