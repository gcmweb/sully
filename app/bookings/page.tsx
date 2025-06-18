"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { 
  Calendar, 
  Clock, 
  Filter, 
  Plus, 
  Search, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ClipboardCheck,
  RefreshCw,
  CalendarDays,
  CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTime, formatDuration } from "@/lib/utils";
import { BookingDialog } from "@/components/booking-dialog";
import { BookingActions } from "@/components/booking-actions";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isMounted, setIsMounted] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    setIsMounted(true);
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [activeTab, selectedPeriod]);

  useEffect(() => {
    if (selectedDate) {
      setSelectedPeriod("custom");
      fetchBookings();
    }
  }, [selectedDate]);

  const fetchBookings = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      let url = '/api/bookings';
      const params = new URLSearchParams();
      
      // Handle tab-specific filtering
      if (activeTab === 'today') {
        params.append('period', 'today');
      } else if (activeTab === 'upcoming') {
        params.append('period', 'upcoming');
      } else if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      
      // Handle period-specific filtering (overrides tab filtering if both are set)
      if (selectedPeriod === "custom" && selectedDate) {
        params.append('date', selectedDate.toISOString().split('T')[0]);
      } else if (selectedPeriod !== "all" && selectedPeriod !== "custom") {
        params.append('period', selectedPeriod);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log("[Bookings] Fetching bookings from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Bookings] API error response:", errorData);
        throw new Error(errorData.error || 'Failed to fetch bookings');
      }
      
      const data = await response.json();
      console.log(`[Bookings] Fetched ${data.length} bookings for tab "${activeTab}" and period "${selectedPeriod}"`);
      
      // Log a sample of bookings to verify they're in the correct category
      if (data.length > 0) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        const sampleBooking = data[0];
        const bookingTime = new Date(sampleBooking.bookingTime);
        const isToday = bookingTime >= todayStart && bookingTime <= todayEnd;
        const isFuture = bookingTime > todayEnd;
        
        console.log("[Bookings] Sample booking:", {
          customerName: sampleBooking.customerName,
          bookingTime: bookingTime.toISOString(),
          isToday,
          isFuture,
          tab: activeTab,
          period: selectedPeriod
        });
      }
      
      setBookings(data);
    } catch (error) {
      console.error("[Bookings] Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOpenDialog = (booking: any = null) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleBookingUpdated = () => {
    fetchBookings();
  };

  const filteredBookings = bookings.filter(booking => {
    // Filter by search query
    return booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           booking.tableId.toString().includes(searchQuery) ||
           booking.notes?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Don't render animations until client-side
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DatePicker date={selectedDate} setDate={setSelectedDate} />
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-0">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 flex items-center justify-center">
                  <p>Loading bookings...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>All Bookings</span>
              </div>
            </SelectItem>
            <SelectItem value="today">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Today Only</span>
              </div>
            </SelectItem>
            <SelectItem value="future">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>Future Only</span>
              </div>
            </SelectItem>
            <SelectItem value="upcoming">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>Today & Future</span>
              </div>
            </SelectItem>
            <SelectItem value="week">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Next 7 Days</span>
              </div>
            </SelectItem>
            <SelectItem value="month">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Next 30 Days</span>
              </div>
            </SelectItem>
            <SelectItem value="past">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Past Bookings</span>
              </div>
            </SelectItem>
            <SelectItem value="custom">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Custom Date</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {selectedPeriod === "custom" && (
          <DatePicker date={selectedDate} setDate={setSelectedDate} />
        )}
        
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

      <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today Only</TabsTrigger>
          <TabsTrigger value="upcoming">Today & Future</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-0">
          <BookingsList 
            bookings={filteredBookings} 
            inView={inView} 
            reference={ref} 
            onEdit={handleOpenDialog}
            onStatusChange={fetchBookings}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="today" className="mt-0">
          <BookingsList 
            bookings={filteredBookings} 
            inView={inView} 
            reference={ref} 
            onEdit={handleOpenDialog}
            onStatusChange={fetchBookings}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-0">
          <BookingsList 
            bookings={filteredBookings} 
            inView={inView} 
            reference={ref} 
            onEdit={handleOpenDialog}
            onStatusChange={fetchBookings}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="confirmed" className="mt-0">
          <BookingsList 
            bookings={filteredBookings} 
            inView={inView} 
            reference={ref} 
            onEdit={handleOpenDialog}
            onStatusChange={fetchBookings}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-0">
          <BookingsList 
            bookings={filteredBookings} 
            inView={inView} 
            reference={ref} 
            onEdit={handleOpenDialog}
            onStatusChange={fetchBookings}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-0">
          <BookingsList 
            bookings={filteredBookings} 
            inView={inView} 
            reference={ref} 
            onEdit={handleOpenDialog}
            onStatusChange={fetchBookings}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      <BookingDialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog} 
        booking={selectedBooking}
        onBookingUpdated={handleBookingUpdated}
      />
    </div>
  );
}

interface BookingsListProps {
  bookings: any[];
  inView: boolean;
  reference: (node?: Element | null | undefined) => void;
  onEdit: (booking: any) => void;
  onStatusChange: () => void;
  isLoading: boolean;
}

function BookingsList({ bookings, inView, reference, onEdit, onStatusChange, isLoading }: BookingsListProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <p>Loading bookings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      ref={reference}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className="space-y-4"
    >
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No bookings found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        bookings.map((booking) => (
          <motion.div key={booking.id} variants={item}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{booking.customerName}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground capitalize">
                        {getStatusIcon(booking.status)}
                        <span>{booking.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(new Date(booking.bookingTime))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(new Date(booking.bookingTime))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClipboardCheck className="h-4 w-4" />
                        Table {booking.tableId}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(booking.duration)}
                      </div>
                    </div>
                    {booking.notes && (
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Notes:</span> {booking.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <BookingActions 
                      booking={booking} 
                      onEdit={onEdit} 
                      onStatusChange={onStatusChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}