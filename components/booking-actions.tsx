"use client";

import { useState } from "react";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface BookingActionsProps {
  booking: any;
  onEdit: (booking: any) => void;
  onStatusChange: () => void;
}

export function BookingActions({ booking, onEdit, onStatusChange }: BookingActionsProps) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCancelBooking = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.bookingId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
      
      toast({
        title: "Booking cancelled",
        description: "The booking has been cancelled successfully.",
      });
      
      onStatusChange();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsCancelDialogOpen(false);
    }
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          status: 'confirmed',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm booking');
      }
      
      toast({
        title: "Booking confirmed",
        description: "The booking has been confirmed successfully.",
      });
      
      onStatusChange();
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to confirm booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsConfirmDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => onEdit(booking)}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        
        {booking.status === "pending" && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            onClick={() => setIsConfirmDialogOpen(true)}
          >
            <CheckCircle className="h-4 w-4" />
            Confirm
          </Button>
        )}
        
        {booking.status !== "cancelled" && (
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setIsCancelDialogOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>

      {/* Confirm Booking Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this booking for {booking.customerName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmBooking();
              }}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Confirming..." : "Confirm Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking for {booking.customerName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>No, keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelBooking();
              }}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Cancelling..." : "Yes, cancel booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}