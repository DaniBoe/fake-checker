import { describe, it, expect } from 'vitest';
import { callImageClassifier } from '@/lib/classifier';

describe('mock classifier', () => {
	it('flags filename containing fake as Fake', async () => {
		const r = await callImageClassifier('https://x/y/fake_image.jpg');
		expect(r.label).toBe('Fake');
		expect(r.confidence).toBeGreaterThan(0.5);
	});

	it('returns Likely Authentic for known brand', async () => {
		const r = await callImageClassifier('https://x/y/photo.jpg', { brand: 'LabCo' });
		expect(r.label).toBe('Likely Authentic');
	});
});




