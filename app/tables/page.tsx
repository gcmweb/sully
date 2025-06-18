"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { 
  Check, 
  Clock, 
  Edit, 
  Filter, 
  Plus, 
  Search, 
  Users, 
  X,
  MapPin,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TableDialog } from "@/components/table-dialog";
import { useToast } from "@/components/ui/use-toast";

export default function TablesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    setIsMounted(true);
    fetchTables();
  }, []);

  useEffect(() => {
    if (statusFilter !== null) {
      fetchTables();
    }
  }, [statusFilter]);

  const fetchTables = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      let url = '/api/tables';
      
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      
      console.log("Fetching tables from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || 'Failed to fetch tables');
      }
      
      const data = await response.json();
      console.log("Fetched tables:", data);
      setTables(data);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tables. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOpenDialog = (table: any = null) => {
    setSelectedTable(table);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTable(null);
    fetchTables();
  };

  const filteredTables = tables.filter(table => {
    // Filter by search query
    const matchesSearch = table.tableId.toString().includes(searchQuery) ||
                          table.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          table.capacity.toString().includes(searchQuery);
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      case "reserved":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Reserved
          </Badge>
        );
      case "occupied":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            <Users className="h-3 w-3 mr-1" />
            Occupied
          </Badge>
        );
      default:
        return null;
    }
  };

  // Don't render animations until client-side
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
          <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>Loading...</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Loading...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Table
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === "available" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("available")}
            className="flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            Available
          </Button>
          <Button 
            variant={statusFilter === "reserved" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("reserved")}
            className="flex items-center gap-1"
          >
            <Clock className="h-4 w-4" />
            Reserved
          </Button>
          <Button 
            variant={statusFilter === "occupied" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("occupied")}
            className="flex items-center gap-1"
          >
            <Users className="h-4 w-4" />
            Occupied
          </Button>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={fetchTables}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-10">
              <p>Loading tables...</p>
            </CardContent>
          </Card>
        ) : filteredTables.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tables found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTables.map((table) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: table.id * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>Table {table.tableId}</CardTitle>
                    {getStatusBadge(table.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Capacity: {table.capacity} {table.capacity === 1 ? 'person' : 'people'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Location: {table.location}</span>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => handleOpenDialog(table)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      <TableDialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog} 
        table={selectedTable} 
      />
    </div>
  );
}