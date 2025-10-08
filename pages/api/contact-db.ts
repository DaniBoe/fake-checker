import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject,
        message,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save submission' });
    }

    return res.status(200).json({ success: true, message: 'Submission saved successfully' });
  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
