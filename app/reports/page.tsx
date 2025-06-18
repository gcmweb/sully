"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Filter, 
  PieChart, 
  Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/date-picker";

// Mock data for demonstration
const occupancyByDayData = [
  { name: "Monday", occupancy: 45 },
  { name: "Tuesday", occupancy: 50 },
  { name: "Wednesday", occupancy: 65 },
  { name: "Thursday", occupancy: 70 },
  { name: "Friday", occupancy: 90 },
  { name: "Saturday", occupancy: 95 },
  { name: "Sunday", occupancy: 80 },
];

const occupancyByHourData = [
  { name: "12:00", occupancy: 30 },
  { name: "13:00", occupancy: 45 },
  { name: "14:00", occupancy: 60 },
  { name: "15:00", occupancy: 40 },
  { name: "16:00", occupancy: 30 },
  { name: "17:00", occupancy: 50 },
  { name: "18:00", occupancy: 70 },
  { name: "19:00", occupancy: 90 },
  { name: "20:00", occupancy: 85 },
  { name: "21:00", occupancy: 65 },
  { name: "22:00", occupancy: 40 },
];

const tableUsageData = [
  { name: "Table 1", usage: 85 },
  { name: "Table 2", usage: 70 },
  { name: "Table 3", usage: 90 },
  { name: "Table 4", usage: 65 },
  { name: "Table 5", usage: 75 },
  { name: "Table 6", usage: 80 },
  { name: "Table 7", usage: 60 },
  { name: "Table 8", usage: 50 },
];

const partySizeData = [
  { name: "1-2 people", value: 35, color: "#3b82f6" },
  { name: "3-4 people", value: 40, color: "#10b981" },
  { name: "5-6 people", value: 15, color: "#f59e0b" },
  { name: "7+ people", value: 10, color: "#ef4444" },
];

const bookingTrendData = [
  { date: "Jan", bookings: 120 },
  { date: "Feb", bookings: 140 },
  { date: "Mar", bookings: 160 },
  { date: "Apr", bookings: 180 },
  { date: "May", bookings: 200 },
  { date: "Jun", bookings: 220 },
  { date: "Jul", bookings: 240 },
  { date: "Aug", bookings: 260 },
  { date: "Sep", bookings: 280 },
  { date: "Oct", bookings: 300 },
  { date: "Nov", bookings: 320 },
  { date: "Dec", bookings: 340 },
];

export default function ReportsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [RechartsComponents, setRechartsComponents] = useState<any>(null);
  
  const [occupancyRef, occupancyInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const [usageRef, usageInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const [trendsRef, trendsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    setIsMounted(true);

    // Dynamically import Recharts components
    const loadRechartsComponents = async () => {
      try {
        const recharts = await import('recharts');
        setRechartsComponents(recharts);
      } catch (error) {
        console.error("Failed to load Recharts components:", error);
      }
    };

    loadRechartsComponents();
  }, []);

  // Render placeholder for charts if Recharts is not loaded yet
  const renderChartPlaceholder = () => (
    <div className="h-80 flex items-center justify-center bg-muted/20 rounded-md">
      <div className="text-muted-foreground">Loading chart...</div>
    </div>
  );

  // Render occupancy by day chart
  const renderOccupancyByDayChart = () => {
    if (!RechartsComponents) return renderChartPlaceholder();

    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={occupancyByDayData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip 
            formatter={(value: any) => [`${value}%`, 'Occupancy']}
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Bar 
            dataKey="occupancy" 
            fill="var(--primary)" 
            radius={[4, 4, 0, 0]} 
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render occupancy by hour chart
  const renderOccupancyByHourChart = () => {
    if (!RechartsComponents) return renderChartPlaceholder();

    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={occupancyByHourData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip 
            formatter={(value: any) => [`${value}%`, 'Occupancy']}
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Bar 
            dataKey="occupancy" 
            fill="var(--primary)" 
            radius={[4, 4, 0, 0]} 
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render table usage chart
  const renderTableUsageChart = () => {
    if (!RechartsComponents) return renderChartPlaceholder();

    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={tableUsageData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" unit="%" />
          <YAxis dataKey="name" type="category" width={60} />
          <Tooltip 
            formatter={(value: any) => [`${value}%`, 'Usage']}
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Bar 
            dataKey="usage" 
            fill="var(--primary)" 
            radius={[0, 4, 4, 0]} 
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render party size chart
  const renderPartySizeChart = () => {
    if (!RechartsComponents) return renderChartPlaceholder();

    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = RechartsComponents;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={partySizeData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1500}
          >
            {partySizeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [`${value}%`, 'Bookings']}
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render booking trends chart
  const renderBookingTrendsChart = () => {
    if (!RechartsComponents) return renderChartPlaceholder();

    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={bookingTrendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value: any) => [value, 'Bookings']}
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="bookings" 
            stroke="var(--primary)" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Don't render charts until client-side
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p>Loading charts...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <div className="flex items-center gap-2">
          <DatePicker date={date} setDate={setDate} />
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="occupancy" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="occupancy" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Occupancy
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Table Usage
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>
        
        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="mt-0">
          <motion.div 
            ref={occupancyRef}
            initial={{ opacity: 0, y: 20 }}
            animate={occupancyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Occupancy by Day of Week</CardTitle>
                <CardDescription>
                  Average restaurant occupancy rate for each day of the week
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {renderOccupancyByDayChart()}
              </CardContent>
            </Card>
            
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Occupancy by Hour</CardTitle>
                <CardDescription>
                  Average restaurant occupancy rate throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {renderOccupancyByHourChart()}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Table Usage Tab */}
        <TabsContent value="usage" className="mt-0">
          <motion.div 
            ref={usageRef}
            initial={{ opacity: 0, y: 20 }}
            animate={usageInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Table Usage</CardTitle>
                <CardDescription>
                  Percentage of time each table is occupied
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {renderTableUsageChart()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Party Size Distribution</CardTitle>
                <CardDescription>
                  Distribution of bookings by party size
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {renderPartySizeChart()}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-0">
          <motion.div 
            ref={trendsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={trendsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="grid gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Booking Trends</CardTitle>
                <CardDescription>
                  Number of bookings per month over the past year
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {renderBookingTrendsChart()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
                <CardDescription>
                  Important metrics for your restaurant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">78%</div>
                    <div className="text-sm text-muted-foreground text-center">
                      Average Occupancy Rate
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                    <Calendar className="h-8 w-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">245</div>
                    <div className="text-sm text-muted-foreground text-center">
                      Bookings This Month
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                    <BarChart3 className="h-8 w-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">3.8</div>
                    <div className="text-sm text-muted-foreground text-center">
                      Average Party Size
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}