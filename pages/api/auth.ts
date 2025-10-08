import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password, isSignUp } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const supabase = createClient();

  try {
    if (isSignUp) {
      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            remaining_checks: 0
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return res.status(500).json({ error: "Failed to create user profile" });
        } else {
          console.log('User profile created successfully:', data.user.id);
        }
      }

      return res.status(200).json({ 
        userId: data.user?.id,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        message: "Account created successfully. Please check your email to verify your account."
      });
    } else {
      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ 
        userId: data.user?.id,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        message: "Signed in successfully"
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
