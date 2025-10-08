export type CountRecord = { timestamps: number[] };

export const MAX_FREE = 3;
export const WINDOW_MS = 24 * 60 * 60 * 1000;

export function isFreemiumDisabled(): boolean {
	return process.env.DISABLE_FREEMIUM_LIMITS === 'true';
}

export function parseCookie(cookieHeader?: string): Record<string, string> {
	const out: Record<string, string> = {};
	if (!cookieHeader) return out;
	cookieHeader.split(/;\s*/).forEach((pair) => {
		const idx = pair.indexOf('=');
		if (idx > -1) {
			const k = decodeURIComponent(pair.slice(0, idx));
			const v = decodeURIComponent(pair.slice(idx + 1));
			out[k] = v;
		}
	});
	return out;
}

export function getAnonymousUsageFromCookie(cookieHeader?: string): CountRecord {
	const map = parseCookie(cookieHeader);
	const raw = map["anon_checks_v1"];
	if (!raw) return { timestamps: [] };
	try {
		const parsed = JSON.parse(raw) as CountRecord;
		return parsed;
	} catch {
		return { timestamps: [] };
	}
}

export function isAnonymousLimitedFromCookie(cookieHeader?: string): boolean {
	if (isFreemiumDisabled()) return false;
	const rec = getAnonymousUsageFromCookie(cookieHeader);
	const now = Date.now();
	const inWindow = rec.timestamps.filter((t) => now - t < WINDOW_MS);
	return inWindow.length >= MAX_FREE;
}

export function makeSetCookieHeaderForAnonIncrement(cookieHeader?: string): string | undefined {
	if (isFreemiumDisabled()) return undefined;
	const rec = getAnonymousUsageFromCookie(cookieHeader);
	const now = Date.now();
	rec.timestamps = rec.timestamps.filter((t) => now - t < WINDOW_MS);
	rec.timestamps.push(now);
	const value = encodeURIComponent(JSON.stringify(rec));
	return `anon_checks_v1=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}
