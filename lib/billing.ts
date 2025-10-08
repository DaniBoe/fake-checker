import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });

export async function createCheckoutSession(params: { priceId: string; customerEmail?: string; baseUrl?: string }) {
	// Development mode - simulate purchase and add checks to account
	if (process.env.NODE_ENV === 'development') {
		// Package definitions
		const packages = {
			'starter': { checks: 10, price: 7.99 },
			'value': { checks: 40, price: 29.99 },
			'pro': { checks: 80, price: 55.99 }
		};
		
		const packageData = packages[params.priceId as keyof typeof packages];
		if (!packageData) {
			throw new Error('Invalid package ID');
		}
		
		// In development, we'll handle the purchase directly in the frontend
		// Return a special URL that triggers the development purchase flow
		const baseUrl = params.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
		return {
			url: `${baseUrl}/?dev-purchase=${params.priceId}&checks=${packageData.checks}&package=${params.priceId}`
		};
	}
	
	// Real Stripe checkout for production
	const baseUrl = params.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
	
	// Package definitions for production
	const packages = {
		'starter': { checks: 10, price: 799, name: 'Starter Pack' },
		'value': { checks: 40, price: 2999, name: 'Value Pack' },
		'pro': { checks: 80, price: 5599, name: 'Pro Pack' }
	};
	
	const packageData = packages[params.priceId as keyof typeof packages];
	if (!packageData) {
		throw new Error('Invalid package ID');
	}
	
	return stripe.checkout.sessions.create({
		mode: "payment",
		line_items: [{
			price_data: {
				currency: 'usd',
				product_data: {
					name: packageData.name,
				},
				unit_amount: packageData.price,
			},
			quantity: 1,
		}],
		success_url: `${baseUrl}/?purchase=success`,
		cancel_url: `${baseUrl}/pricing?status=cancelled`,
		customer_email: params.customerEmail,
		metadata: {
			packageId: params.priceId,
			checks: packageData.checks.toString()
		},
		// Enable automatic emails
		payment_intent_data: {
			receipt_email: params.customerEmail,
		},
		// Send receipt email automatically
		invoice_creation: {
			enabled: true,
		}
	});
}

