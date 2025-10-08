import crypto from 'crypto';

// Mock database for testing
const mockSupabase = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        gte: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          then: (callback: any) => Promise.resolve(callback({ data: [], error: null }))
        }),
        then: (callback: any) => Promise.resolve(callback({ data: [], error: null }))
      }),
      gte: (column: string, value: any) => ({
        then: (callback: any) => Promise.resolve(callback({ data: [], error: null }))
      }),
      then: (callback: any) => Promise.resolve(callback({ data: [], error: null }))
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns: string) => ({
            single: () => Promise.resolve({ data: { remaining_checks: 5 }, error: null })
          })
        }),
        select: (columns: string) => ({
          single: () => Promise.resolve({ data: { remaining_checks: 5 }, error: null })
        })
      }),
      select: (columns: string) => ({
        single: () => Promise.resolve({ data: { remaining_checks: 5 }, error: null })
      })
    }),
    raw: (query: string) => query
  })
};

// Use mock database in test environment, real database otherwise
function createClient() {
  if (process.env.NODE_ENV === 'test') {
    return mockSupabase;
  }
  
  // Import real database client
  const { createClient: createRealClient } = require('./db');
  const client = createRealClient();
  console.log('🔧 Usage enhanced client created');
  return client;
}

// Privacy-compliant hashing for GDPR/CCPA compliance
// These functions create one-way hashes that cannot be reversed to original IP/UA
export function hashIP(ip: string): string {
  // Hash IP with salt for privacy - cannot be reversed to original IP
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production';
  return crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 16);
}

export function hashUserAgent(userAgent: string): string {
  // Hash user agent with salt for privacy - cannot be reversed to original UA
  const salt = process.env.UA_HASH_SALT || 'default-salt-change-in-production';
  return crypto.createHash('sha256').update(userAgent + salt).digest('hex').substring(0, 16);
}

export function getClientFingerprint(req: any): { ipHash: string; uaHash: string } {
  // Get real IP (considering proxies)
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress || 
             '127.0.0.1';
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  return {
    ipHash: hashIP(ip),
    uaHash: hashUserAgent(userAgent)
  };
}

export interface UsageStats {
  freeChecksUsed: number;
  paidChecksRemaining: number;
  totalChecksThisWeek: number;
  isLimited: boolean;
}

export async function getUsageStats(userId?: string, ipHash?: string, uaHash?: string): Promise<UsageStats> {
  const supabase = createClient();
  const now = new Date();
  
  // Calculate the start of the current week (Monday)
  const weekStart = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back to Monday
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  console.log('Getting usage stats for:', { userId, ipHash, uaHash, weekStart: weekStart.toISOString() });
  console.log('UserId type:', typeof userId, 'Value:', userId);
  
  // Get free checks used in the current week
  let freeUsageQuery = supabase
    .from('usage_logs')
    .select('*')
    .gte('created_at', weekStart.toISOString());
  
  if (userId) {
    // For authenticated users, count only free checks for this user
    freeUsageQuery = freeUsageQuery.eq('user_id', userId).eq('check_type', 'free');
  } else {
    // For anonymous users, count all checks (they're all free)
    freeUsageQuery = freeUsageQuery.is('user_id', null);
  }
  
  const { data: freeUsage, error: freeError } = await freeUsageQuery;
  
  if (freeError) {
    console.error('Error fetching free usage:', freeError);
  }
  
  console.log('Free usage data:', freeUsage);
  const freeChecksUsed = freeUsage?.length || 0;
  
  // Get paid checks remaining for user
  let paidChecksRemaining = 0;
  if (userId) {
    console.log('🔍 Fetching paid checks for user:', userId);
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('remaining_checks')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user profile for paid checks:', userError);
      
      // If profile doesn't exist, create it
      if (userError.code === 'PGRST116') {
        console.log('🔧 User profile not found, creating one...');
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            remaining_checks: 0
          });
        
        if (createError) {
          console.error('Error creating user profile:', createError);
        } else {
          console.log('🔧 User profile created successfully');
        }
      }
    } else {
      console.log('🔍 User profile data:', user);
    }
    
    paidChecksRemaining = user?.remaining_checks || 0;
    console.log('🔍 Paid checks remaining:', paidChecksRemaining);
  }
  
  // Get total checks this week (for abuse detection)
  const { data: totalUsage } = await supabase
    .from('usage_logs')
    .select('*')
    .gte('created_at', weekStart.toISOString());
  
  const totalChecksThisWeek = totalUsage?.length || 0;
  
  // Check if user is limited (3 free checks per week)
  const isLimited = freeChecksUsed >= 3;
  console.log('isLimited calculation:', { freeChecksUsed, isLimited });
  
  const result = {
    freeChecksUsed,
    paidChecksRemaining,
    totalChecksThisWeek,
    isLimited
  };
  
  console.log('Usage stats result:', result);
  return result;
}

export async function logUsage(
  userId: string | null, 
  ipHash: string, 
  uaHash: string, 
  checkType: 'free' | 'paid'
): Promise<void> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('usage_logs')
    .insert({
      user_id: userId || null,
      ip_hash: ipHash,
      user_agent_hash: uaHash,
      check_type: checkType
    });
  
  if (error) {
    console.error('Failed to log usage:', error);
    throw new Error(`Failed to log usage: ${error.message}`);
  }
  
  console.log('Successfully logged usage:', { userId, ipHash, uaHash, checkType });
}

export async function checkRateLimit(identifier: string, action: string = 'check'): Promise<boolean> {
  const supabase = createClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour window
  
  // Check current rate limit
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())
    .single();
  
  if (existing) {
    // If more than 100 checks per hour, block (increased for testing)
    if (existing.count >= 100) {
      return false;
    }
    
    // Increment count
    await supabase
      .from('rate_limits')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id);
  } else {
    // Create new rate limit record
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        action,
        count: 1,
        window_start: now.toISOString()
      });
  }
  
  return true;
}

export async function detectAbuse(ipHash: string, uaHash: string): Promise<boolean> {
  const supabase = createClient();
  const now = new Date();
  
  // Calculate the start of the current week (Monday)
  const weekStart = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back to Monday
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  // Check for suspicious activity patterns
  const { data: ipUsage } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('ip_hash', ipHash)
    .gte('created_at', weekStart.toISOString());
  
  const { data: uaUsage } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_agent_hash', uaHash)
    .gte('created_at', weekStart.toISOString());
  
  // Flag as abuse if:
  // - More than 50 checks from same IP this week (increased from daily limit)
  // - More than 40 checks from same user agent this week (increased from daily limit)
  // - More than 10 different user agents from same IP this week (increased from daily limit)
  const ipCount = ipUsage?.length || 0;
  const uaCount = uaUsage?.length || 0;
  
  // Get unique user agents for this IP
  const { data: uniqueUAs } = await supabase
    .from('usage_logs')
    .select('user_agent_hash')
    .eq('ip_hash', ipHash)
    .gte('created_at', weekStart.toISOString());
  
  const uniqueUACount = new Set(uniqueUAs?.map((u: any) => u.user_agent_hash) || []).size;
  
  return ipCount > 50 || uaCount > 40 || uniqueUACount > 10;
}

export async function deductPaidCheck(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  console.log('🔧 Deducting paid check for user:', userId);
  
  // First get current remaining_checks
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('remaining_checks')
    .eq('id', userId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching current profile for deduction:', fetchError);
    return false;
  }
  
  const currentChecks = currentProfile?.remaining_checks || 0;
  console.log('🔧 Current checks before deduction:', currentChecks);
  
  if (currentChecks <= 0) {
    console.log('🔧 No checks remaining, cannot deduct');
    return false;
  }
  
  const newChecks = currentChecks - 1;
  console.log('🔧 Deducting check, new count will be:', newChecks);
  
  // Update with new value
  const { data, error } = await supabase
    .from('profiles')
    .update({ remaining_checks: newChecks })
    .eq('id', userId)
    .select('remaining_checks')
    .single();
  
  if (error) {
    console.error('Error deducting paid check:', error);
    return false;
  }
  
  console.log('🔧 Successfully deducted check, new count:', data?.remaining_checks);
  return true;
}

export async function addPaidChecks(userId: string, checksToAdd: number): Promise<void> {
  const supabase = createClient();
  
  // First get current remaining_checks
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('remaining_checks')
    .eq('id', userId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching current profile for addition:', fetchError);
    throw new Error('Failed to fetch current profile');
  }
  
  const currentChecks = currentProfile?.remaining_checks || 0;
  const newChecks = currentChecks + checksToAdd;
  
  // Update with new value
  const { error } = await supabase
    .from('profiles')
    .update({ remaining_checks: newChecks })
    .eq('id', userId);
  
  if (error) {
    console.error('Error adding paid checks:', error);
    throw new Error('Failed to add paid checks');
  }
}

