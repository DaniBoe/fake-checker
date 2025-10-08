"use client";

import { useEffect } from "react";

// Extend Window interface for Google Analytics
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function GoogleAnalytics() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    
    if (!gaId) {
      console.log("No GA ID found");
      return;
    }

    console.log("Loading Google Analytics with ID:", gaId);

    // Initialize dataLayer FIRST, before loading the script
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;
    
    console.log("dataLayer initialized:", window.dataLayer);

    // Test the URL first
    const testUrl = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    console.log("Testing URL:", testUrl);

    // Load the Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = testUrl;
    script.onerror = () => {
      console.error("Failed to load Google Analytics script - 404 error");
    };
    script.onload = () => {
      console.log("Google Analytics script loaded successfully");
      // Initialize gtag after script loads
      gtag('js', new Date());
      gtag('config', gaId);
      console.log("Google Analytics initialized");
      console.log("dataLayer after init:", window.dataLayer);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      const existingScript = document.querySelector(`script[src*="googletagmanager.com"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}
