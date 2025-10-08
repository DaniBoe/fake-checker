"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import AuthModal from "./AuthModal";

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    checks: 10,
    price: 7.99,
    pricePerCheck: 0.80,
    popular: false
  },
  {
    id: 'value',
    name: 'Value Pack',
    checks: 40,
    price: 29.99,
    pricePerCheck: 0.75,
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    checks: 80,
    price: 55.99,
    pricePerCheck: 0.70,
    popular: false
  }
];

export default function PaywallModal({ open, onOpenChange, userId, onUserIdChange }: { 
  open: boolean; 
  onOpenChange: (v: boolean)=>void; 
  userId: string | null;
  onUserIdChange: (userId: string | null) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handlePurchase = async (packageId: string) => {
    console.log('🔍 PaywallModal handlePurchase called with:', { packageId, userId });
    
    // Check if user is authenticated
    if (!userId) {
      console.log('❌ No userId, opening auth modal');
      setAuthModalOpen(true);
      return;
    }

    console.log('🛒 Starting purchase for package:', packageId, 'with userId:', userId);
    setLoading(packageId);
    try {
      const requestBody = { packageId, userId };
      console.log('🛒 Sending request body:', requestBody);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Checkout response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Checkout response data:', data);
        if (data.url) {
          console.log('Redirecting to:', data.url);
          window.location.href = data.url;
        } else {
          console.error('No URL in response:', data);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to create checkout session:', errorData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleAuthSuccess = (newUserId: string) => {
    onUserIdChange(newUserId);
    setAuthModalOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl rounded-xl bg-neutral-900 border border-white/10 p-6 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Dialog.Close>
          <Dialog.Title className="text-2xl font-bold mb-2 text-center text-white">You've reached your free checks</Dialog.Title>
          <p className="text-center text-gray-300 mb-6">Keep checking with a one-time package — no subscription needed.</p>
          
          {/* Benefits Section */}
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3 text-center">Why upgrade?</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-200">More accurate results</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-200">Faster processing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-200">Priority support</span>
              </div>
            </div>
          </div>
          {process.env.NODE_ENV === 'development' && process.env.TEST_MODE === 'true' && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-center text-blue-300 text-sm">
                🧪 <strong>Test Mode:</strong> Purchases are simulated - no real charges
              </p>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-3">
            {PACKAGES.map((pkg) => (
              <div 
                key={pkg.id} 
                className={`relative rounded-lg border-2 p-4 ${
                  pkg.popular 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-white/20 bg-neutral-800/50'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full">Best Value</span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-white">{pkg.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-white">${pkg.price}</span>
                    <span className="text-gray-400 text-sm ml-1">one-time</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{pkg.checks} checks</p>
                  <p className="text-xs text-gray-400">${pkg.pricePerCheck.toFixed(2)} per check</p>
                  
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading === pkg.id}
                    className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-colors ${
                      pkg.popular
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                  >
                    {loading === pkg.id ? 'Processing...' : `Buy Now – $${pkg.price}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 mb-2">Your checks never expire.</p>
            <p className="text-xs text-gray-400">One-time payment — no recurring fees.</p>
            {!userId && (
              <p className="text-xs text-emerald-400 mt-2">
                🔐 Sign in required to purchase packages
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      
      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </Dialog.Root>
  );
}
