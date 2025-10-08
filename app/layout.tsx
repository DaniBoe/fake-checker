import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

export const metadata = {
	title: "Labubus Checker",
	description: "Classify labubus photos as Authentic, Suspicious, or Fake",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const clerkKey = process.env.CLERK_PUBLISHABLE_KEY;
	return (
		<html lang="en" className="dark">
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
