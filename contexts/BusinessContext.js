"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Create the context
const BusinessContext = createContext();

// Custom hook to use the business context
export function useBusinessContext() {
  return useContext(BusinessContext);
}

// Provider component
export function BusinessProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Changed to false by default
  const [error, setError] = useState(null);

  // For single business model, set default business data
  useEffect(() => {
    console.log("[BusinessContext] Initializing with default business data");
    
    // Set default business data for single restaurant model
    const defaultBusiness = {
      id: "sully-restaurant",
      name: "Sully Restaurant",
      description: "A robust, reliable solution for restaurant booking management",
      address: "123 Main Street, City, Country",
      phone: "+1 (555) 123-4567",
      email: "contact@sullyrestaurant.com",
      website: "https://www.sullyrestaurant.com",
      logo: "/image.png",
      timezone: "UTC",
      settings: {
        defaultBookingDuration: 120,
        maxPartySize: 12,
        minAdvanceBookingHours: 1,
        maxAdvanceBookingDays: 30,
        allowTableSelection: true
      }
    };

    setBusinesses([defaultBusiness]);
    setCurrentBusiness(defaultBusiness);
    setIsLoading(false);
    setError(null);
    
    console.log("[BusinessContext] Default business data set:", defaultBusiness.name);
  }, []);

  // Function to switch the current business (not needed for single business but kept for compatibility)
  const switchBusiness = (businessId) => {
    console.log("[BusinessContext] Switch business requested:", businessId);
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      setCurrentBusiness(business);
      console.log("[BusinessContext] Business switched to:", business.name);
    } else {
      console.warn(`[BusinessContext] Business with ID ${businessId} not found`);
    }
  };

  // Function to update business settings
  const updateBusinessSettings = (newSettings) => {
    if (currentBusiness) {
      const updatedBusiness = {
        ...currentBusiness,
        settings: {
          ...currentBusiness.settings,
          ...newSettings
        }
      };
      setCurrentBusiness(updatedBusiness);
      
      // Update in businesses array
      setBusinesses(prev => prev.map(b => 
        b.id === updatedBusiness.id ? updatedBusiness : b
      ));
      
      console.log("[BusinessContext] Business settings updated");
    }
  };

  // Value object to be provided to consumers
  const value = {
    businesses,
    currentBusiness,
    isLoading,
    error,
    switchBusiness,
    updateBusinessSettings
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}