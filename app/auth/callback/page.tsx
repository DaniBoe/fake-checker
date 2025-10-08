"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const error = urlParams.get('error');
    
    // Debug: Log all URL parameters
    console.log('Auth callback URL:', window.location.href);
    console.log('URL parameters:', Object.fromEntries(urlParams.entries()));

    if (error) {
      console.error('Auth error:', error);
      setStatus("Authentication failed. Please try again.");
      setTimeout(() => {
        router.push('/');
      }, 3000);
      return;
    }

    if (accessToken && refreshToken) {
      console.log('Tokens received, storing in localStorage');
      setStatus("Email confirmed! Redirecting...");
      
      // Store tokens in localStorage for the session
      localStorage.setItem('supabase_access_token', accessToken);
      localStorage.setItem('supabase_refresh_token', refreshToken);
      
      // Redirect to home page
      setTimeout(() => {
        router.push('/?auth=confirmed');
      }, 2000);
    } else {
      console.log('Missing tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
      setStatus("Invalid authentication response. Please try again.");
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Email Confirmation</h1>
        <p className="text-gray-300">{status}</p>
      </div>
    </div>
  );
}


