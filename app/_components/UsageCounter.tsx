"use client";

interface UsageCounterProps {
  freeChecksUsed: number;
  paidChecksRemaining: number;
  checkType?: 'free' | 'paid';
  onUpgradeClick?: () => void;
}

export default function UsageCounter({ freeChecksUsed, paidChecksRemaining, checkType, onUpgradeClick }: UsageCounterProps) {
  const totalFreeChecks = 3;
  const freeChecksLeft = Math.max(0, totalFreeChecks - freeChecksUsed);
  
  // Cap the progress bar at 100% to prevent overflow
  const progressPercentage = Math.min(100, (freeChecksUsed / totalFreeChecks) * 100);
  const isAtLimit = freeChecksUsed >= totalFreeChecks;
  
  
  return (
    <div className="space-y-3">
      {/* Only show free checks if user has no paid checks remaining */}
      {paidChecksRemaining === 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Free checks this week</span>
            <span className={`${isAtLimit ? 'text-amber-300' : 'text-gray-300'}`}>
              {freeChecksLeft}/{totalFreeChecks}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {checkType === 'free' && (
            <p className="text-xs text-emerald-400">✓ Used free check</p>
          )}
          {isAtLimit && (
            <p className="text-xs text-amber-400">⚠️ Free limit reached</p>
          )}
        </div>
      )}
      
      {/* Paid checks counter */}
      {paidChecksRemaining > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Paid checks remaining</span>
            <span className="text-cyan-300 font-medium">{paidChecksRemaining}</span>
          </div>
          {checkType === 'paid' && (
            <p className="text-xs text-cyan-400">✓ Used paid check</p>
          )}
        </div>
      )}
      
      {/* Free limit reached warning - only show if no paid checks remaining */}
      {freeChecksLeft === 0 && paidChecksRemaining === 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-amber-300">
              Free limit reached. Purchase a package to continue.
            </p>
            {onUpgradeClick && (
              <button
                onClick={() => {
                  console.log('View Pricing button clicked');
                  onUpgradeClick();
                }}
                className="ml-3 px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-rose-400 text-black text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                View Pricing
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

