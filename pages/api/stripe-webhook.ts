import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/billing";
import { createClient } from "@/lib/db";

export const config = { api: { bodyParser: false } };

function buffer(req: any) {
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on("data", (chunk: Buffer) => chunks.push(chunk));
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).end("Method not allowed");
	const sig = req.headers["stripe-signature"] as string | undefined;
	if (!sig) return res.status(400).send("Missing signature");
	const buf = await buffer(req);
	
	try {
		const event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
		const supabase = createClient();
		
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as any;
				
				// Get package info from metadata
				const packageId = session.metadata?.packageId;
				const checks = parseInt(session.metadata?.checks || '0');
				
				if (!packageId || !checks) {
					console.error('Missing package info in session metadata');
					break;
				}
				
				// Find or create user profile
				let userId: string;
				
				if (session.customer_email) {
					// Try to find existing user by email
					const { data: existingUser } = await supabase
						.from('profiles')
						.select('id')
						.eq('email', session.customer_email)
						.single();
					
					if (existingUser) {
						userId = existingUser.id;
					} else {
						// Create new user
						const { data: newUser, error } = await supabase
							.from('profiles')
							.insert({
								email: session.customer_email,
								stripe_customer_id: session.customer,
							})
							.select('id')
							.single();
						
						if (error) throw error;
						userId = newUser.id;
					}
				} else {
					// Guest purchase - create anonymous user
					const { data: newUser, error } = await supabase
						.from('profiles')
						.insert({
							stripe_customer_id: session.customer,
						})
						.select('id')
						.single();
					
					if (error) throw error;
					userId = newUser.id;
				}
				
				// Add checks to user's account
				// First get current remaining_checks
				const { data: currentProfile, error: profileError } = await supabase
					.from('profiles')
					.select('remaining_checks')
					.eq('id', userId)
					.single();
				
				if (profileError) throw profileError;
				
				const currentChecks = currentProfile?.remaining_checks || 0;
				const newChecks = currentChecks + checks;
				
				// Update with new total
				const { error: updateError } = await supabase
					.from('profiles')
					.update({ remaining_checks: newChecks })
					.eq('id', userId);
				
				if (updateError) throw updateError;
				
				// Record the purchase
				await supabase
					.from('package_purchases')
					.insert({
						user_id: userId,
						stripe_payment_intent_id: session.payment_intent,
						package_type: packageId,
						checks_purchased: checks,
						amount_paid_cents: session.amount_total || 0,
					});
				
				console.log(`Added ${checks} checks to user ${userId} for package ${packageId}`);
				break;
			}
			
			case 'payment_intent.payment_failed': {
				const paymentIntent = event.data.object as any;
				console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error);
				break;
			}
			
			default:
				console.log(`Unhandled event type: ${event.type}`);
		}
		
		return res.status(200).json({ received: true });
	} catch (err: any) {
		console.error('Webhook handler error:', err);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}
}
