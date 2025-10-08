import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");
  
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: "Development endpoint only" });
  }

  const { userId, packageId } = req.body;

  if (!userId || !packageId) {
    return res.status(400).json({ error: "userId and packageId are required" });
  }

  // Package definitions
  const packages = {
    'starter': { checks: 10, price: 7.99 },
    'value': { checks: 40, price: 29.99 },
    'pro': { checks: 80, price: 55.99 }
  };

  const packageData = packages[packageId as keyof typeof packages];
  if (!packageData) {
    return res.status(400).json({ error: "Invalid package ID" });
  }

  try {
    console.log('🔧 Starting development purchase process...');
    const supabase = createClient();
    console.log('🔧 Supabase client created');
    
    // Test the connection
    console.log('🔧 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
      return res.status(500).json({ 
        error: "Database connection failed",
        details: testError.message 
      });
    }
    console.log('🔧 Supabase connection test passed');

    // First, check if user profile exists
    console.log('🔧 Checking if user profile exists...');
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, remaining_checks')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      
      // Try to create the user profile if it doesn't exist
      console.log('Attempting to create user profile...');
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          remaining_checks: 0
        });

      if (createError) {
        console.error('Error creating user profile:', createError);
        return res.status(500).json({ 
          error: "Failed to create user profile",
          details: createError.message 
        });
      }

      console.log('User profile created successfully');
    }

    console.log('Current user profile:', existingUser);

    // Add checks to user's account
    console.log('🔧 Updating user checks...');
    
    // First get current remaining_checks
    const { data: currentProfile, error: fetchCurrentError } = await supabase
      .from('profiles')
      .select('remaining_checks')
      .eq('id', userId)
      .single();
    
    if (fetchCurrentError) {
      console.error('Error fetching current profile:', fetchCurrentError);
      return res.status(500).json({ 
        error: "Failed to fetch current profile",
        details: fetchCurrentError.message 
      });
    }
    
    const newRemainingChecks = (currentProfile?.remaining_checks || 0) + packageData.checks;
    console.log('🔧 Updating checks from', currentProfile?.remaining_checks, 'to', newRemainingChecks);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        remaining_checks: newRemainingChecks
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user checks:', updateError);
      return res.status(500).json({ 
        error: "Failed to update user checks",
        details: updateError.message 
      });
    }
    console.log('🔧 User checks updated successfully');

    // Verify the update worked
    const { data: updatedUser, error: verifyError } = await supabase
      .from('profiles')
      .select('remaining_checks')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
    } else {
      console.log('Updated user profile:', updatedUser);
    }

    // Record the purchase
    console.log('🔧 Recording purchase...');
    const { error: purchaseError } = await supabase
      .from('package_purchases')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: `dev_${Date.now()}`, // Mock payment intent ID
        package_type: packageId,
        checks_purchased: packageData.checks,
        amount_paid_cents: Math.round(packageData.price * 100),
      });

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      return res.status(500).json({ 
        error: "Failed to record purchase",
        details: purchaseError.message 
      });
    }
    console.log('🔧 Purchase recorded successfully');

    console.log(`✅ Development: Added ${packageData.checks} checks to user ${userId} for package ${packageId}`);

    return res.status(200).json({ 
      success: true, 
      checksAdded: packageData.checks,
      package: packageId,
      message: `Successfully added ${packageData.checks} checks to your account!`
    });

  } catch (error) {
    console.error('Development purchase error:', error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
