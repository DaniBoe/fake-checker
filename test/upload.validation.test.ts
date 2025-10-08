import { describe, it, expect } from 'vitest';
import { ALLOWED_MIME, MAX_SIZE_BYTES } from '@/pages/api/check';

describe('upload validation constants', () => {
	it('includes common image types', () => {
		expect(ALLOWED_MIME.has('image/jpeg')).toBe(true);
		expect(ALLOWED_MIME.has('image/png')).toBe(true);
	});
	it('max size is 8MB', () => {
		expect(MAX_SIZE_BYTES).toBe(8 * 1024 * 1024);
	});
});




