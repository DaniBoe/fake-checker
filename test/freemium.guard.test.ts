import { describe, it, expect } from 'vitest';
import { isAnonymousLimitedFromCookie, makeSetCookieHeaderForAnonIncrement } from '@/lib/usage-node';

function extractCookieValue(setHeader: string): string | undefined {
	const m = /^anon_checks_v1=([^;]+);/.exec(setHeader);
	return m?.[1];
}

describe('freemium guard', () => {
	it('allows up to 3 checks within 24h', () => {
		let cookieHeader: string | undefined = undefined;
		for (let i = 0; i < 3; i++) {
			expect(isAnonymousLimitedFromCookie(cookieHeader)).toBe(false);
			const set = makeSetCookieHeaderForAnonIncrement(cookieHeader);
			const val = extractCookieValue(set)!;
			cookieHeader = `anon_checks_v1=${val}`;
		}
		expect(isAnonymousLimitedFromCookie(cookieHeader)).toBe(true);
	});
});





