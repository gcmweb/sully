"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { 
  Code, 
  Copy, 
  ExternalLink, 
  Eye, 
  Globe, 
  Palette, 
  Settings, 
  Check,
  Sliders,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmbedFormPreview } from "@/components/embed-form-preview";

export default function EmbedPage() {
  const [isMounted, setIsMounted] = useState(false);
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
  const [iframeHeight, setIframeHeight] = useState(500);
  const [iframeWidth, setIframeWidth] = useState(400);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [scriptCode, setScriptCode] = useState("");
  const [directUrl, setDirectUrl] = useState("");
  const { toast } = useToast();
  
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    setIsMounted(true);
    generateEmbedCodes();
  }, []);

  useEffect(() => {
    if (isMounted) {
      generateEmbedCodes();
    }
  }, [formSettings, iframeHeight, iframeWidth, isMounted]);

  const generateEmbedCodes = () => {
    setIsGeneratingCode(true);
    
    try {
      // Create query params from settings
      const params = new URLSearchParams();
      Object.entries(formSettings).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
      
      // Generate direct URL
      const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : 'https://your-domain.com';
      
      const bookingFormUrl = `${baseUrl}/embed-form?${params.toString()}`;
      setDirectUrl(bookingFormUrl);
      
      // Generate iframe code with scrolling="no" and overflow="hidden"
      const iframeCode = `<iframe 
  src="${bookingFormUrl}" 
  width="${iframeWidth}" 
  height="${iframeHeight}" 
  frameborder="0" 
  scrolling="no"
  style="border-radius: ${formSettings.borderRadius}px; max-width: 100%; overflow: hidden;"
  title="${formSettings.formTitle}"
></iframe>`;
      
      setEmbedCode(iframeCode);
      
      // Generate JavaScript snippet with improved height adjustment
      const scriptCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/booking-widget.js';
    script.setAttribute('data-sully-form', '${params.toString()}');
    document.head.appendChild(script);
  })();
</script>
<div id="sully-booking-form"></div>`;
      
      setScriptCode(scriptCode);
    } catch (error) {
      console.error("Error generating embed codes:", error);
      toast({
        title: "Error",
        description: "Failed to generate embed codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: `${type} code has been copied to clipboard.`,
        });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Error",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  const handleSettingChange = (key: string, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Don't render until client-side
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Embed Booking Form</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-20 flex items-center justify-center">
              <p>Loading embed options...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Embed Booking Form</h1>
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={generateEmbedCodes}
          disabled={isGeneratingCode}
        >
          <RefreshCw className={`h-4 w-4 ${isGeneratingCode ? 'animate-spin' : ''}`} />
          Refresh Codes
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Fields & Text
              </TabsTrigger>
              <TabsTrigger value="embed" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Embed Codes
              </TabsTrigger>
            </TabsList>
            
            {/* Appearance Tab */}
            <TabsContent value="appearance" className="mt-0">
              <motion.div 
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Form Appearance
                    </CardTitle>
                    <CardDescription>
                      Customize the look and feel of your booking form
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor" className="flex items-center gap-2">
                            Primary Color
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: formSettings.primaryColor }}
                            ></div>
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="primaryColor"
                              type="color"
                              value={formSettings.primaryColor}
                              onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={formSettings.primaryColor}
                              onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="backgroundColor" className="flex items-center gap-2">
                            Background Color
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: formSettings.backgroundColor }}
                            ></div>
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="backgroundColor"
                              type="color"
                              value={formSettings.backgroundColor}
                              onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={formSettings.backgroundColor}
                              onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="textColor" className="flex items-center gap-2">
                            Text Color
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: formSettings.textColor }}
                            ></div>
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="textColor"
                              type="color"
                              value={formSettings.textColor}
                              onChange={(e) => handleSettingChange('textColor', e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={formSettings.textColor}
                              onChange={(e) => handleSettingChange('textColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="borderRadius" className="flex justify-between">
                            <span>Border Radius: {formSettings.borderRadius}px</span>
                          </Label>
                          <Slider
                            id="borderRadius"
                            min={0}
                            max={20}
                            step={1}
                            value={[formSettings.borderRadius]}
                            onValueChange={(value) => handleSettingChange('borderRadius', value[0])}
                            className="py-4"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="iframeWidth" className="flex justify-between">
                            <span>Form Width: {iframeWidth}px</span>
                          </Label>
                          <Slider
                            id="iframeWidth"
                            min={300}
                            max={800}
                            step={10}
                            value={[iframeWidth]}
                            onValueChange={(value) => setIframeWidth(value[0])}
                            className="py-4"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="iframeHeight" className="flex justify-between">
                            <span>Form Height: {iframeHeight}px</span>
                          </Label>
                          <Slider
                            id="iframeHeight"
                            min={400}
                            max={800}
                            step={10}
                            value={[iframeHeight]}
                            onValueChange={(value) => setIframeHeight(value[0])}
                            className="py-4"
                          />
                          <p className="text-xs text-muted-foreground">
                            Note: The actual height will adjust automatically based on content.
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-4">
                          <Switch
                            id="showLogo"
                            checked={formSettings.showLogo}
                            onCheckedChange={(checked) => handleSettingChange('showLogo', checked)}
                          />
                          <Label htmlFor="showLogo">Show Sully logo</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            {/* Fields & Text Tab */}
            <TabsContent value="fields" className="mt-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Form Fields & Text
                    </CardTitle>
                    <CardDescription>
                      Customize the fields and text displayed on your booking form
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="formTitle">Form Title</Label>
                          <Input
                            id="formTitle"
                            value={formSettings.formTitle}
                            onChange={(e) => handleSettingChange('formTitle', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="restaurantName">Restaurant Name</Label>
                          <Input
                            id="restaurantName"
                            value={formSettings.restaurantName}
                            onChange={(e) => handleSettingChange('restaurantName', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="submitButtonText">Submit Button Text</Label>
                          <Input
                            id="submitButtonText"
                            value={formSettings.submitButtonText}
                            onChange={(e) => handleSettingChange('submitButtonText', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="successMessage">Success Message</Label>
                          <Textarea
                            id="successMessage"
                            value={formSettings.successMessage}
                            onChange={(e) => handleSettingChange('successMessage', e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium mb-2">Optional Fields</h3>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showEmail"
                            checked={formSettings.showEmail}
                            onCheckedChange={(checked) => handleSettingChange('showEmail', checked)}
                          />
                          <Label htmlFor="showEmail">Email Address</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showPhone"
                            checked={formSettings.showPhone}
                            onCheckedChange={(checked) => handleSettingChange('showPhone', checked)}
                          />
                          <Label htmlFor="showPhone">Phone Number</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showNotes"
                            checked={formSettings.showNotes}
                            onCheckedChange={(checked) => handleSettingChange('showNotes', checked)}
                          />
                          <Label htmlFor="showNotes">Special Requests / Notes</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            {/* Embed Codes Tab */}
            <TabsContent value="embed" className="mt-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      Embed Codes
                    </CardTitle>
                    <CardDescription>
                      Copy and paste these codes to embed the booking form on your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="iframeCode" className="text-base">Iframe Embed Code</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => copyToClipboard(embedCode, "Iframe")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </Button>
                        </div>
                        <Textarea
                          id="iframeCode"
                          value={embedCode}
                          readOnly
                          rows={5}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use this code to embed the booking form directly into your website using an iframe.
                          The height will adjust automatically based on content.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="scriptCode" className="text-base">JavaScript Widget Code</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => copyToClipboard(scriptCode, "JavaScript")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </Button>
                        </div>
                        <Textarea
                          id="scriptCode"
                          value={scriptCode}
                          readOnly
                          rows={8}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use this code to embed the booking form as a JavaScript widget. The form will be loaded dynamically
                          and will automatically adjust its height based on content.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="directUrl" className="text-base">Direct URL</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => copyToClipboard(directUrl, "Direct URL")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="directUrl"
                            value={directUrl}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => window.open(directUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use this URL to link directly to the booking form or to create your own custom embed code.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Preview Card */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your booking form will look
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div 
                className="border rounded-md overflow-hidden"
                style={{ 
                  width: `${iframeWidth}px`, 
                  maxWidth: '100%',
                  height: `${iframeHeight}px`,
                  borderRadius: `${formSettings.borderRadius}px`
                }}
              >
                <EmbedFormPreview settings={formSettings} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => window.open(directUrl, '_blank')}
              >
                <Globe className="h-4 w-4" />
                Open in New Tab
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}