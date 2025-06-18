"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { 
  Save, 
  Moon, 
  Sun, 
  Laptop, 
  Bell, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Clock,
  Calendar,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { OpeningHoursEditor } from "@/components/opening-hours-editor";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [restaurantName, setRestaurantName] = useState("Sully Restaurant");
  const [address, setAddress] = useState("123 Main Street, City, Country");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [email, setEmail] = useState("contact@sullyrestaurant.com");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openingHours, setOpeningHours] = useState<any[]>([]);
  const { toast } = useToast();
  
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    setIsMounted(true);
    fetchOpeningHours();
  }, []);

  const fetchOpeningHours = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/opening-hours');
      
      if (!response.ok) {
        throw new Error('Failed to fetch opening hours');
      }
      
      const data = await response.json();
      console.log("Fetched opening hours:", data);
      setOpeningHours(data);
    } catch (error) {
      console.error("Error fetching opening hours:", error);
      toast({
        title: "Error",
        description: "Failed to fetch opening hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveOpeningHours = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/opening-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openingHours),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save opening hours');
      }
      
      const data = await response.json();
      console.log("Saved opening hours:", data);
      
      toast({
        title: "Opening hours saved",
        description: "Your opening hours have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving opening hours:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save opening hours",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpeningHoursChange = (updatedHours: any[]) => {
    setOpeningHours(updatedHours);
  };

  // Don't render theme-dependent UI until client-side
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-20 flex items-center justify-center">
              <p>Loading settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Restaurant
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Opening Hours
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="mt-0">
          <motion.div 
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>
                  Update your restaurant details and business information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurantName">Restaurant Name</Label>
                    <Input 
                      id="restaurantName" 
                      value={restaurantName} 
                      onChange={(e) => setRestaurantName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Restaurant Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter a description of your restaurant" 
                    className="min-h-[100px]"
                    defaultValue="Sully Restaurant offers a unique dining experience with a focus on local ingredients and innovative cuisine. Our friendly staff and cozy atmosphere make us the perfect choice for any occasion."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Opening Hours Settings */}
        <TabsContent value="hours" className="mt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Opening Hours</CardTitle>
                    <CardDescription>
                      Set your restaurant's opening hours for each day of the week
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2" 
                    onClick={fetchOpeningHours}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <p>Loading opening hours...</p>
                  </div>
                ) : (
                  <OpeningHoursEditor 
                    openingHours={openingHours} 
                    onChange={handleOpeningHoursChange} 
                  />
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="flex items-center gap-2"
                  onClick={saveOpeningHours}
                  disabled={isSaving || isLoading}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Opening Hours"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance" className="mt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Button 
                      variant={theme === "light" ? "default" : "outline"} 
                      className="flex flex-col items-center justify-center gap-2 h-auto py-4"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-6 w-6" />
                      <span>Light</span>
                    </Button>
                    <Button 
                      variant={theme === "dark" ? "default" : "outline"} 
                      className="flex flex-col items-center justify-center gap-2 h-auto py-4"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-6 w-6" />
                      <span>Dark</span>
                    </Button>
                    <Button 
                      variant={theme === "system" ? "default" : "outline"} 
                      className="flex flex-col items-center justify-center gap-2 h-auto py-4"
                      onClick={() => setTheme("system")}
                    >
                      <Laptop className="h-6 w-6" />
                      <span>System</span>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select defaultValue="mdy">
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select defaultValue="12h">
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Notifications Settings */}
        <TabsContent value="notifications" className="mt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about bookings and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive booking confirmations and updates via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive real-time alerts in the browser
                    </p>
                  </div>
                  <Switch 
                    checked={pushNotifications} 
                    onCheckedChange={setPushNotifications} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Notification Events</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="new-booking" defaultChecked />
                      <Label htmlFor="new-booking">New Booking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="booking-modification" defaultChecked />
                      <Label htmlFor="booking-modification">Booking Modification</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="booking-cancellation" defaultChecked />
                      <Label htmlFor="booking-cancellation">Booking Cancellation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="reminders" defaultChecked />
                      <Label htmlFor="reminders">Daily Reminders</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Account Settings */}
        <TabsContent value="account" className="mt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue="Admin User" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountEmail">Email Address</Label>
                    <Input id="accountEmail" type="email" defaultValue="admin@sullyrestaurant.com" />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Log Out</Button>
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}