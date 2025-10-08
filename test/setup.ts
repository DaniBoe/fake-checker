import { beforeAll } from 'vitest';

beforeAll(() => {
	// Set up test environment variables
	process.env.NODE_ENV = 'test';
	process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
	process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
	process.env.IP_HASH_SALT = 'test-ip-salt';
	process.env.UA_HASH_SALT = 'test-ua-salt';
	process.env.DISABLE_FREEMIUM_LIMITS = 'false';
});
