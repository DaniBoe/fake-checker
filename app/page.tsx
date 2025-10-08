"use client";

import { useState, useEffect } from "react";
import Dropzone from "./_components/Dropzone";
import UploadPreview from "./_components/UploadPreview";
import ResultCard from "./_components/ResultCard";
import PaywallModal from "./_components/PaywallModal";
import HeroCollage from "./_components/HeroCollage";
import UsageCounter from "./_components/UsageCounter";
import UserProfile from "./_components/UserProfile";

export default function Page() {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<any>(null);
	const [paywallOpen, setPaywallOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
	const [usage, setUsage] = useState<{freeChecksUsed: number, paidChecksRemaining: number, checkType?: 'free' | 'paid'}>({
		freeChecksUsed: 0,
		paidChecksRemaining: 0
	});
	const [userId, setUserId] = useState<string | null>(null);
	const [pendingDevPurchase, setPendingDevPurchase] = useState<string | null>(null);

	// Check for development purchase on page load (before authentication)
	useEffect(() => {
		console.log('🔍 Checking URL parameters:', window.location.search);
		const urlParams = new URLSearchParams(window.location.search);
		const devPurchase = urlParams.get('dev-purchase');
		
		if (devPurchase) {
			console.log('🛒 Development purchase detected on page load:', devPurchase);
			setPendingDevPurchase(devPurchase);
			// Clear the URL parameter immediately
			window.history.replaceState({}, '', window.location.pathname);
		} else {
			console.log('🔍 No dev-purchase parameter found');
		}
	}, []); // Run only once on mount

	// Handle pending development purchase when user is authenticated
	useEffect(() => {
		console.log('🔍 Auth state check:', { pendingDevPurchase, userId });
		if (pendingDevPurchase && userId) {
			console.log('🛒 Processing pending development purchase:', { pendingDevPurchase, userId });
			handleDevPurchase(userId, pendingDevPurchase);
			setPendingDevPurchase(null);
		}
	}, [userId, pendingDevPurchase]);

	// Check for purchase success parameter and auth confirmation
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		
		if (urlParams.get('purchase') === 'success') {
			setShowPurchaseSuccess(true);
			// Refresh usage stats if user is authenticated
			if (userId) {
				fetchUsageStats();
			}
			// Clear the URL parameter
			window.history.replaceState({}, '', window.location.pathname);
		}
		
		// Also check for authentication on purchase success
		if (urlParams.get('purchase') === 'success') {
			const accessToken = localStorage.getItem('supabase_access_token');
			console.log('Purchase success - checking auth:', { accessToken: !!accessToken, userId });
			if (accessToken) {
				try {
					const payload = JSON.parse(atob(accessToken.split('.')[1]));
					if (payload.sub) {
						console.log('Setting userId from purchase success:', payload.sub);
						setUserId(payload.sub);
					}
				} catch (e) {
					console.error('Error parsing token:', e);
				}
			}
		}
	
		// Handle auth confirmation
		if (urlParams.get('auth') === 'confirmed') {
			// Get user ID from localStorage tokens
			const accessToken = localStorage.getItem('supabase_access_token');
			if (accessToken) {
				// Extract user ID from token (simplified - in production use proper JWT parsing)
				try {
					const payload = JSON.parse(atob(accessToken.split('.')[1]));
					if (payload.sub) {
						setUserId(payload.sub);
					}
				} catch (e) {
					console.error('Error parsing token:', e);
				}
			}
			// Clear the URL parameter
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, [userId]);

	// Check if user is already authenticated on page load (separate useEffect)
	useEffect(() => {
		const checkAuth = () => {
			const accessToken = localStorage.getItem('supabase_access_token');
			console.log('Checking auth on page load:', { accessToken: !!accessToken, userId });
			if (accessToken) {
				try {
					const payload = JSON.parse(atob(accessToken.split('.')[1]));
					if (payload.sub && payload.sub !== userId) {
						console.log('Setting userId from token:', payload.sub);
						setUserId(payload.sub);
					}
				} catch (e) {
					console.error('Error parsing token:', e);
				}
			}
		};
		
		// Check immediately
		checkAuth();
		
		// Also check after a short delay to catch any race conditions
		const timeoutId = setTimeout(checkAuth, 100);
		
		return () => clearTimeout(timeoutId);
	}, []); // Run only once on mount

	// Fetch usage stats on page load (for both authenticated and anonymous users)
	useEffect(() => {
		const fetchInitialUsageStats = async () => {
			console.log('🔄 Fetching initial usage stats on page load');
			try {
				const response = await fetch('/api/usage-stats', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId: userId || null })
				});
				
				if (response.ok) {
					const stats = await response.json();
					console.log('📊 Initial usage stats received:', stats);
					setUsage({
						freeChecksUsed: stats.freeChecksUsed,
						paidChecksRemaining: stats.paidChecksRemaining,
						checkType: 'free'
					});
				} else {
					console.error('Failed to fetch initial usage stats');
				}
			} catch (error) {
				console.error('Error fetching initial usage stats:', error);
			}
		};

		// Fetch usage stats after a short delay to ensure userId is set
		const timer = setTimeout(fetchInitialUsageStats, 200);
		return () => clearTimeout(timer);
	}, [userId]);

	// Additional authentication check that runs on every render
	useEffect(() => {
		const accessToken = localStorage.getItem('supabase_access_token');
		if (accessToken && !userId) {
			try {
				const payload = JSON.parse(atob(accessToken.split('.')[1]));
				if (payload.sub) {
					console.log('Setting userId from token (additional check):', payload.sub);
					setUserId(payload.sub);
				}
			} catch (e) {
				console.error('Error parsing token (additional check):', e);
			}
		}
	});

// Fetch usage stats when user is authenticated
useEffect(() => {
	if (userId) {
		fetchUsageStats();
	}
}, [userId]);

	async function fetchUsageStats() {
		if (!userId) return;
		
		try {
			console.log('📊 Fetching usage stats for user:', userId);
			const response = await fetch('/api/usage-stats', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});
			
			if (response.ok) {
				const data = await response.json();
				console.log('📊 Usage stats received:', data);
				setUsage(data);
			} else {
				console.error('❌ Failed to fetch usage stats:', response.status);
			}
		} catch (error) {
			console.error('❌ Error fetching usage stats:', error);
		}
	}

	async function handleDevPurchase(userId: string, packageId: string) {
		try {
			console.log('🛒 Development purchase:', { userId, packageId });
			
			const response = await fetch('/api/dev-purchase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, packageId })
			});
			
			if (response.ok) {
				const data = await response.json();
				console.log('✅ Development purchase successful:', data);
				
				// Show success message
				setShowPurchaseSuccess(true);
				
				// Wait a moment for the database to update
				setTimeout(async () => {
					console.log('🔄 Refreshing usage stats...');
					await fetchUsageStats();
				}, 1000);
			} else {
				const error = await response.json();
				console.error('❌ Development purchase failed:', error);
				alert(`Purchase failed: ${error.error}`);
			}
		} catch (error) {
			console.error('❌ Development purchase error:', error);
			alert(`Purchase error: ${error}`);
		}
	}


	async function handleCheck(imageFile: File) {
		setLoading(true);
		setResult(null);
		try {
			const form = new FormData();
			form.append("file", imageFile);
			if (userId) {
				form.append("userId", userId);
			}
			const res = await fetch("/api/check", { method: "POST", body: form });
			
			if (res.status === 402) {
				const json = await res.json();
				// Update usage stats from 402 response
				if (json.usage) {
					setUsage(json.usage);
				}
				setPaywallOpen(true);
				return;
			}
			const json = await res.json();
			setResult(json);
			
			// Update usage stats if provided
			if (json.usage) {
				console.log('📊 Updating usage from check response:', json.usage);
				setUsage(json.usage);
			} else if (userId) {
				// If no usage data in response but user is authenticated, fetch it
				console.log('📊 No usage in response, fetching usage stats...');
				fetchUsageStats();
			}
		} catch (error) {
			console.error('Error in handleCheck:', error);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className={`relative min-h-screen overflow-hidden ${paywallOpen ? 'blur-sm' : ''}`}>
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(147,51,234,0.25),transparent_60%),radial-gradient(40%_40%_at_10%_90%,rgba(6,182,212,0.2),transparent_60%),radial-gradient(40%_40%_at_90%_90%,rgba(34,197,94,0.18),transparent_60%)]" />
			<header className="relative z-10 border-b border-white/10 backdrop-blur bg-neutral-950/60">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
					<div className="flex items-center gap-2">
						<div className="h-6 w-6 sm:h-8 sm:w-8 rounded-md bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-black grid place-items-center font-bold text-sm sm:text-base">L</div>
						<span className="font-semibold text-sm sm:text-base">Labubus Checker</span>
					</div>
					<nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-300">
						<UserProfile userId={userId} onUserIdChange={setUserId} usage={usage} />
						<a href="/pricing" className="hover:text-white">Pricing</a>
						<a href="/contact" className="hover:text-white">Contact</a>
					</nav>
				</div>
			</header>

			{/* Purchase Success Message */}
			{showPurchaseSuccess && (
				<div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pt-4">
					<div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 mb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
									</svg>
								</div>
								<div className="ml-3">
									<h3 className="text-sm font-medium text-emerald-300">
										Purchase Successful!
									</h3>
									<p className="text-sm text-emerald-200 mt-1">
										Your checks have been added to your account. You can now continue checking images.
									</p>
									{usage.paidChecksRemaining > 0 && (
										<p className="text-sm text-emerald-300 mt-1 font-medium">
											💰 You now have {usage.paidChecksRemaining} paid checks remaining
										</p>
									)}
									{window.location.search.includes('test=true') && (
										<p className="text-xs text-emerald-300 mt-1 font-mono">
											🧪 Test Mode: This was a simulated purchase
										</p>
									)}
								</div>
							</div>
							<button
								onClick={() => setShowPurchaseSuccess(false)}
								className="text-emerald-400 hover:text-emerald-300"
							>
								<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			)}

			<main className="relative z-10">
				<section className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-12 md:pt-16 text-center">
					<h1 className="bg-gradient-to-r from-white via-emerald-200 to-rose-200 bg-clip-text text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-transparent">
						Fake-check labubus photos — see REAL vs FAKE instantly
					</h1>
					<p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base md:text-lg text-gray-300">
						Upload any labubus photo and get a verdict with reasons and confidence.
					</p>
					<div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
						<a href="#upload" className="w-full sm:w-auto rounded-md bg-gradient-to-r from-emerald-400 to-rose-400 px-4 py-2 text-black font-medium text-center">Get started</a>
						<a href="/pricing" className="w-full sm:w-auto rounded-md border border-white/15 px-4 py-2 text-gray-200 hover:bg-white/5 text-center">See pricing</a>
					</div>
					<HeroCollage />
				</section>

				<section id="upload" className="mx-auto mt-6 sm:mt-10 max-w-4xl px-4 sm:px-6">
					<div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur">
						<Dropzone onFileSelected={(f)=>{setFile(f);}} onSubmit={handleCheck} loading={loading} />
						{file && <div className="mt-4"><UploadPreview file={file} /></div>}
						
						{/* Usage counter */}
						<div className="mt-4 sm:mt-6">
							<UsageCounter 
								freeChecksUsed={usage.freeChecksUsed}
								paidChecksRemaining={usage.paidChecksRemaining}
								checkType={usage.checkType}
								onUpgradeClick={() => {
									console.log('Setting paywallOpen to true');
									setPaywallOpen(true);
								}}
							/>
							
						</div>
						
						
						{result && (
							<div className="mt-4 sm:mt-6">
								<p className="mb-2 text-sm font-medium text-gray-200"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">3</span>View your result</p>
								<ResultCard result={result} />
							</div>
						)}
					</div>
				</section>

			</main>

			<footer className="relative z-10 border-t border-white/10 bg-neutral-950/60 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm text-gray-300">
					<p>© {new Date().getFullYear()} Labubus Checker</p>
					<a href="/pricing" className="rounded-md bg-gradient-to-r from-emerald-400 to-rose-400 px-3 py-1.5 text-black font-medium text-xs sm:text-sm">Upgrade</a>
				</div>
			</footer>

			{/* Paywall Modal */}
			<PaywallModal 
				open={paywallOpen} 
				onOpenChange={setPaywallOpen} 
				userId={userId}
				onUserIdChange={setUserId}
			/>
		</div>
	);
}
