import { cookies } from "next/headers";

// Basic freemium guard: 3 checks per rolling day (24h) for unauthenticated users.
// For authenticated users, integrate with DB to store per-user counters.

type CountRecord = { timestamps: number[] };

const MAX_FREE = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function getAnonymousUsage(): CountRecord {
	const store = cookies();
	const raw = store.get("anon_checks_v1")?.value;
	try {
		if (!raw) return { timestamps: [] };
		const parsed = JSON.parse(raw) as CountRecord;
		return parsed;
	} catch {
		return { timestamps: [] };
	}
}

export function incrementAnonymousUsage() {
	const store = cookies();
	const rec = getAnonymousUsage();
	const now = Date.now();
	rec.timestamps = rec.timestamps.filter((t) => now - t < WINDOW_MS);
	rec.timestamps.push(now);
	store.set("anon_checks_v1", JSON.stringify(rec), { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
}

export function isAnonymousLimited(): boolean {
	const rec = getAnonymousUsage();
	const now = Date.now();
	const inWindow = rec.timestamps.filter((t) => now - t < WINDOW_MS);
	return inWindow.length >= MAX_FREE;
}






