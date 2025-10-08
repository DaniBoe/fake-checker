"use client";

import { useState, useEffect } from "react";
import AuthModal from "../_components/AuthModal";
import UserProfile from "../_components/UserProfile";

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    checks: 10,
    price: 7.99,
    pricePerCheck: 0.80,
    popular: false,
    description: 'Perfect for trying out the service'
  },
  {
    id: 'value',
    name: 'Value Pack',
    checks: 40,
    price: 29.99,
    pricePerCheck: 0.75,
    popular: true,
    description: 'Best value for regular users'
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    checks: 80,
    price: 55.99,
    pricePerCheck: 0.70,
    popular: false,
    description: 'For serious collectors and resellers'
  }
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [usage, setUsage] = useState<{freeChecksUsed: number, paidChecksRemaining: number, checkType?: 'free' | 'paid'}>({
    freeChecksUsed: 0,
    paidChecksRemaining: 0
  });

  // Check for existing authentication on page load
  useEffect(() => {
    const accessToken = localStorage.getItem('supabase_access_token');
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.sub) {
          setUserId(payload.sub);
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
  }, []);

  // Fetch usage stats when user is authenticated
  useEffect(() => {
    const fetchUsageStats = async () => {
      if (userId) {
        try {
          const response = await fetch('/api/usage-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          
          if (response.ok) {
            const stats = await response.json();
            setUsage({
              freeChecksUsed: stats.freeChecksUsed,
              paidChecksRemaining: stats.paidChecksRemaining,
              checkType: 'free'
            });
          }
        } catch (error) {
          console.error('Error fetching usage stats:', error);
        }
      }
    };

    fetchUsageStats();
  }, [userId]);

  const handlePurchase = async (packageId: string) => {
    if (!userId) {
      setAuthModalOpen(true);
      return;
    }
    
    setLoading(packageId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, userId })
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleAuthSuccess = (newUserId: string) => {
    setUserId(newUserId);
    setAuthModalOpen(false);
  };

  const handleUserIdChange = (newUserId: string | null) => {
    setUserId(newUserId);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur bg-neutral-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-md bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-black grid place-items-center font-bold text-sm sm:text-base">L</div>
            <span className="font-semibold text-sm sm:text-base">Labubus Checker</span>
          </div>
          <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-300">
            <UserProfile userId={userId} onUserIdChange={handleUserIdChange} usage={usage} />
            <a href="/" className="hover:text-white">Home</a>
            <a href="/contact" className="hover:text-white">Contact</a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Back to Main Button */}
        <div className="mb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Choose Your Package</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            One-time payments, no subscriptions. Your checks never expire.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-12 p-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Why upgrade to premium?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0"></div>
              <span className="text-gray-200">More accurate results</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0"></div>
              <span className="text-gray-200">Faster processing</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0"></div>
              <span className="text-gray-200">Priority support</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`relative rounded-xl border-2 p-6 ${
                pkg.popular 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-gray-700 bg-neutral-900'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-sm px-4 py-1 rounded-full font-medium">
                    Best Value
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{pkg.description}</p>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-1">${pkg.price}</div>
                  <div className="text-gray-400 text-sm">one-time payment</div>
                  <div className="text-gray-500 text-xs mt-1">{pkg.checks} checks • ${pkg.pricePerCheck.toFixed(2)} per check</div>
                </div>
                
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading === pkg.id}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    pkg.popular
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {loading === pkg.id ? 'Processing...' : `Buy Now - $${pkg.price}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-neutral-900 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">Free Tier</h3>
            <p className="text-gray-300 mb-4">3 free checks per week</p>
            <div className="text-sm text-gray-400">
              <p>✓ No registration required</p>
              <p>✓ Basic authentication results</p>
              <p>✓ Perfect for occasional use</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>All packages include the same high-quality authentication service.</p>
          <p>Your checks never expire and work across all devices.</p>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  );
}
