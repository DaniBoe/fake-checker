// Script to reset usage limits for testing
// Run with: node scripts/reset-usage-limits.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetUsageLimits() {
  try {
    console.log('🗑️ Clearing usage logs...');
    await supabase.from('usage_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🗑️ Clearing rate limits...');
    await supabase.from('rate_limits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Usage limits reset! You should have 3 free checks now.');
    
  } catch (error) {
    console.error('❌ Error resetting limits:', error);
  }
}

resetUsageLimits();
