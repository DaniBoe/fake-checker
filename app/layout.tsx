import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

export const metadata = {
	title: "Labubus Checker",
	description: "Classify labubus photos as Authentic, Suspicious, or Fake",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const clerkKey = process.env.CLERK_PUBLISHABLE_KEY;
	const gaId = process.env.NEXT_PUBLIC_GA_ID;
	
	return (
		<html lang="en" className="dark">
			<head>
				{gaId && (
					<>
						<script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
						<script
							dangerouslySetInnerHTML={{
								__html: `
									window.dataLayer = window.dataLayer || [];
									function gtag(){dataLayer.push(arguments);}
									gtag('js', new Date());
									gtag('config', '${gaId}');
								`,
							}}
						/>
					</>
				)}
			</head>
			<body className="bg-neutral-950 text-gray-100">
				{clerkKey ? (
					<ClerkProvider publishableKey={clerkKey}>{children}</ClerkProvider>
				) : (
					children
				)}
			</body>
		</html>
	);
}
