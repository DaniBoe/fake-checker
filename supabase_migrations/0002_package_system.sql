-- Add remaining_checks column to profiles table
ALTER TABLE profiles ADD COLUMN remaining_checks INTEGER DEFAULT 0;

-- Add usage_logs table for abuse prevention and audit trail
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_hash TEXT NOT NULL, -- Hashed IP address for privacy
    user_agent_hash TEXT NOT NULL, -- Hashed user agent for device fingerprinting
    check_type TEXT NOT NULL CHECK (check_type IN ('free', 'paid')), -- Track if using free or paid checks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for abuse detection queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_ip_hash ON usage_logs(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_agent_hash ON usage_logs(user_agent_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id, created_at);

-- Add package_purchases table to track one-time purchases
CREATE TABLE IF NOT EXISTS package_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    package_type TEXT NOT NULL CHECK (package_type IN ('starter', 'value', 'pro')),
    checks_purchased INTEGER NOT NULL,
    amount_paid_cents INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for purchase tracking
CREATE INDEX IF NOT EXISTS idx_package_purchases_user_id ON package_purchases(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_package_purchases_stripe_id ON package_purchases(stripe_payment_intent_id);

-- Add rate_limits table for abuse prevention
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP hash or user ID
    action TEXT NOT NULL, -- 'check', 'upload', etc.
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON rate_limits(identifier, action, window_start);





