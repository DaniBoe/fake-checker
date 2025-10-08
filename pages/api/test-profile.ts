import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");
  
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: "Development endpoint only" });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    console.log('🔍 Testing profile for user:', userId);
    const supabase = createClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ 
        error: "Failed to fetch profile",
        details: profileError.message 
      });
    }

    // Get recent purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('package_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (purchaseError) {
      console.error('Purchase fetch error:', purchaseError);
    }

    console.log('🔍 Profile data:', profile);
    console.log('🔍 Recent purchases:', purchases);

    return res.status(200).json({ 
      profile,
      recentPurchases: purchases || [],
      message: "Profile data retrieved successfully"
    });

  } catch (error) {
    console.error('Test profile error:', error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
