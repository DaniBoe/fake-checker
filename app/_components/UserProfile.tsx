"use client";

import { useState } from "react";
import AuthModal from "./AuthModal";

interface UserProfileProps {
  userId: string | null;
  onUserIdChange: (userId: string | null) => void;
  usage?: {
    freeChecksUsed: number;
    paidChecksRemaining: number;
    checkType?: 'free' | 'paid';
  };
}

export default function UserProfile({ userId, onUserIdChange, usage }: UserProfileProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSignOut = () => {
    // Clear localStorage tokens
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
    onUserIdChange(null);
  };

  const handleAuthSuccess = (newUserId: string) => {
    onUserIdChange(newUserId);
    setAuthModalOpen(false);
  };

  if (userId) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-300">
          <span className="text-emerald-400">✓</span> Signed in
        </div>
        {usage ? (
          <div className="text-xs text-gray-400">
            {usage.paidChecksRemaining > 0 ? (
              <span className="text-emerald-400">
                {usage.paidChecksRemaining} paid checks
              </span>
            ) : (
              <span className="text-amber-400">
                {Math.max(0, 3 - usage.freeChecksUsed)} free checks left
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            Loading...
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setAuthModalOpen(true)}
        className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        Sign in
      </button>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
