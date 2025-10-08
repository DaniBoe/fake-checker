// Script to clear user data for testing
// Run with: node scripts/clear-user-data.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearUserData() {
  const email = 'daniel.boettcher89@gmail.com';
  
  try {
    console.log('🔍 Finding user with email:', email);
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      console.log('❌ User not found or already deleted');
      return;
    }
    
    const userId = user.id;
    console.log('👤 Found user ID:', userId);
    
    // Delete related data
    console.log('🗑️ Deleting usage logs...');
    await supabase.from('usage_logs').delete().eq('user_id', userId);
    
    console.log('🗑️ Deleting package purchases...');
    await supabase.from('package_purchases').delete().eq('user_id', userId);
    
    console.log('🗑️ Deleting user profile...');
    await supabase.from('profiles').delete().eq('id', userId);
    
    console.log('✅ User data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
}

clearUserData();
