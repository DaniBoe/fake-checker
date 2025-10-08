import type { NextApiRequest, NextApiResponse } from "next";
import { createCheckoutSession } from "@/lib/billing";
import { createClient } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');
  
  try {
    console.log('🔧 Create checkout session - request body:', req.body);
    console.log('🔧 Create checkout session - request headers:', req.headers);
    
    const { packageId, userId } = req.body;
    
    console.log('🔧 Creating checkout session:', { packageId, userId });
    
    if (!packageId) {
      console.log('❌ Missing packageId');
      return res.status(400).json({ error: 'Package ID is required' });
    }
    
    if (!userId) {
      console.log('❌ Missing userId');
      return res.status(400).json({ error: 'User authentication required' });
    }
    
    // Get user's email from database
    const supabase = createClient();
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user profile:', userError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
    
    const customerEmail = userProfile?.email;
    console.log('🔧 User email for Stripe:', customerEmail);
    
    // Use the billing function which includes test mode logic
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    const session = await createCheckoutSession({ priceId: packageId, customerEmail, baseUrl });
    
    console.log('Checkout session created:', { url: session.url });
    
    return res.status(200).json({ id: 'test-session', url: session.url });
  } catch (e: any) {
    console.error('Checkout session error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
