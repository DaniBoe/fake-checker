import type { NextApiRequest, NextApiResponse } from "next";
import { getUsageStats } from "@/lib/usage-enhanced";
import { getClientFingerprint } from "@/lib/usage-enhanced";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');
  
  try {
    const { userId } = req.body;
    
    console.log('📊 Usage stats API called for user:', userId);
    
    // Get client fingerprint for anonymous users
    const { ipHash, uaHash } = getClientFingerprint(req);
    
    // Get usage stats for the user (authenticated or anonymous)
    const usageStats = await getUsageStats(userId || null, ipHash, uaHash);
    
    console.log('📊 Usage stats API returning:', usageStats);
    return res.status(200).json(usageStats);
  } catch (e: any) {
    console.error('Usage stats error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}


