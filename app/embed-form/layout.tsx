import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Book a Table - Sully Booking System",
  description: "Make a reservation at our restaurant",
};

export default function EmbedFormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          /* Hide any navigation elements when in iframe */
          .hamburger-button, 
          .sidebar-purple,
          nav,
          header {
            display: none !important;
          }
          
          /* Ensure no padding is added for sidebar */
          body {
            padding: 0 !important;
            margin: 0 !important;
            overflow-x: hidden !important;
          }
          
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          
          /* Remove any fixed positioning that might affect the form */
          .fixed {
            position: static !important;
          }
          
          /* Ensure the form takes full width */
          .booking-form-container {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
          }
        `}</style>
      </head>
      <body className={`${inter.className} embed-form-body`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}