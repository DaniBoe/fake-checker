import type { NextApiRequest, NextApiResponse } from "next";
import { createCheckoutSession } from "@/lib/billing";

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
    
    // Use the billing function which includes test mode logic
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    const session = await createCheckoutSession({ priceId: packageId, customerEmail: userId, baseUrl });
    
    console.log('Checkout session created:', { url: session.url });
    
    return res.status(200).json({ id: 'test-session', url: session.url });
  } catch (e: any) {
    console.error('Checkout session error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
