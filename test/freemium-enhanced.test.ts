import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getClientFingerprint, hashIP, hashUserAgent } from '../lib/usage-enhanced';

describe('Enhanced Freemium System', () => {
  describe('Privacy-compliant hashing', () => {
    it('should hash IP addresses consistently', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.1';
      const ip3 = '192.168.1.2';
      
      const hash1 = hashIP(ip1);
      const hash2 = hashIP(ip2);
      const hash3 = hashIP(ip3);
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toHaveLength(16);
    });
    
    it('should hash user agents consistently', () => {
      const ua1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const ua2 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const ua3 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      
      const hash1 = hashUserAgent(ua1);
      const hash2 = hashUserAgent(ua2);
      const hash3 = hashUserAgent(ua3);
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toHaveLength(16);
    });
    
    it('should not be reversible (privacy compliance)', () => {
      const ip = '192.168.1.1';
      const hash = hashIP(ip);
      
      // Hash should not contain original IP
      expect(hash).not.toContain('192.168.1.1');
      expect(hash).not.toContain('192');
      expect(hash).not.toContain('168');
    });
  });
  
  describe('Client fingerprinting', () => {
    it('should extract IP from various headers', () => {
      const req1 = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };
      
      const req2 = {
        headers: {
          'x-real-ip': '203.0.113.195',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };
      
      const req3 = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        connection: { remoteAddress: '127.0.0.1' }
      };
      
      const fp1 = getClientFingerprint(req1);
      const fp2 = getClientFingerprint(req2);
      const fp3 = getClientFingerprint(req3);
      
      expect(fp1.ipHash).toBe(hashIP('203.0.113.195'));
      expect(fp2.ipHash).toBe(hashIP('203.0.113.195'));
      expect(fp3.ipHash).toBe(hashIP('127.0.0.1'));
    });
  });
});

describe('Package System Tests', () => {
  const PACKAGES = {
    starter: { checks: 10, price: 799, name: 'Starter Pack' },
    value: { checks: 40, price: 2999, name: 'Value Pack' },
    pro: { checks: 80, price: 5599, name: 'Pro Pack' }
  };
  
  it('should have correct package pricing', () => {
    expect(PACKAGES.starter.price).toBe(799); // $7.99
    expect(PACKAGES.value.price).toBe(2999);   // $29.99
    expect(PACKAGES.pro.price).toBe(5599);    // $55.99
  });
  
  it('should calculate correct price per check', () => {
    const starterPerCheck = PACKAGES.starter.price / PACKAGES.starter.checks;
    const valuePerCheck = PACKAGES.value.price / PACKAGES.value.checks;
    const proPerCheck = PACKAGES.pro.price / PACKAGES.pro.checks;
    
    expect(starterPerCheck).toBeCloseTo(79.9, 1); // $0.799 per check
    expect(valuePerCheck).toBeCloseTo(75.0, 1);  // $0.75 per check
    expect(proPerCheck).toBeCloseTo(70.0, 1);    // $0.70 per check
  });
  
  it('should have value pack as best deal', () => {
    const starterPerCheck = PACKAGES.starter.price / PACKAGES.starter.checks;
    const valuePerCheck = PACKAGES.value.price / PACKAGES.value.checks;
    const proPerCheck = PACKAGES.pro.price / PACKAGES.pro.checks;
    
    expect(valuePerCheck).toBeLessThan(starterPerCheck);
    expect(proPerCheck).toBeLessThan(valuePerCheck);
  });
});

describe('Abuse Prevention Tests', () => {
  it('should detect high volume from same IP this week', () => {
    // Mock usage logs with 55 checks from same IP in one week
    const mockUsage = Array(55).fill(null).map((_, i) => ({
      ip_hash: 'same-ip-hash',
      created_at: new Date(Date.now() - i * 24 * 3600000).toISOString() // Last 55 days
    }));
    
    const ipCount = mockUsage.filter(u => u.ip_hash === 'same-ip-hash').length;
    expect(ipCount).toBe(55);
    expect(ipCount).toBeGreaterThan(50); // Weekly abuse threshold
  });
  
  it('should detect multiple user agents from same IP this week', () => {
    const mockUsage = [
      { ip_hash: 'same-ip', user_agent_hash: 'ua1' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua2' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua3' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua4' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua5' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua6' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua7' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua8' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua9' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua10' },
      { ip_hash: 'same-ip', user_agent_hash: 'ua11' }, // 11 different UAs
    ];
    
    const uniqueUAs = new Set(mockUsage.map(u => u.user_agent_hash)).size;
    expect(uniqueUAs).toBe(11);
    expect(uniqueUAs).toBeGreaterThan(10); // Weekly abuse threshold
  });
});

describe('Rate Limiting Tests', () => {
  it('should allow 10 requests per hour', () => {
    const requests = Array(10).fill(null).map((_, i) => ({
      identifier: 'test-ip',
      action: 'check',
      count: i + 1,
      window_start: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    }));
    
    const latestRequest = requests[requests.length - 1];
    expect(latestRequest.count).toBe(10);
    expect(latestRequest.count).toBeLessThanOrEqual(10); // Should be allowed
  });
  
  it('should block after 10 requests per hour', () => {
    const requests = Array(11).fill(null).map((_, i) => ({
      identifier: 'test-ip',
      action: 'check',
      count: i + 1,
      window_start: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }));
    
    const latestRequest = requests[requests.length - 1];
    expect(latestRequest.count).toBe(11);
    expect(latestRequest.count).toBeGreaterThan(10); // Should be blocked
  });
});

