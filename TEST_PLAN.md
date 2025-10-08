# Enhanced Freemium System - Test Plan

## Test Scenarios

### 1. Free Tier Logic
- [ ] **Free user limit reached → paywall triggered**
  - Upload 3 images successfully (within one week)
  - Attempt 4th upload
  - Verify paywall modal appears
  - Verify 402 status code returned

### 2. Package Purchase Flow
- [ ] **Purchase adds correct number of checks**
  - Complete Stripe checkout for Starter Pack (10 checks)
  - Verify user's `remaining_checks` increased by 10
  - Verify purchase recorded in `package_purchases` table
  - Test with Value Pack (50 checks) and Pro Pack (200 checks)

### 3. Check Deduction Logic
- [ ] **Deduction works across sessions and devices**
  - Purchase package on Device A
  - Use checks on Device B (same user)
  - Verify checks decrement correctly
  - Verify free checks reset weekly while paid checks persist

### 4. Abuse Prevention
- [ ] **Incognito/browser reset does not bypass limit**
  - Use 3 free checks in normal browser
  - Open incognito window
  - Attempt 4th check
  - Verify still blocked (IP-based tracking)

- [ ] **Rate limiting blocks excessive requests**
  - Send 10 requests within 1 hour
  - Verify 10th request succeeds
  - Send 11th request
  - Verify 429 status code returned

- [ ] **Abuse detection triggers on suspicious activity**
  - Send 50+ requests from same IP in 1 week
  - Verify 429 status with "Suspicious activity detected"
  - Test with 10+ different user agents from same IP

### 5. Privacy Compliance
- [ ] **IP addresses are properly hashed**
  - Verify IP hashes are 16 characters long
  - Verify same IP produces same hash
  - Verify different IPs produce different hashes
  - Verify original IP cannot be extracted from hash

- [ ] **User agents are properly hashed**
  - Verify UA hashes are 16 characters long
  - Verify same UA produces same hash
  - Verify different UAs produce different hashes
  - Verify original UA cannot be extracted from hash

### 6. Database Operations
- [ ] **Usage logging works correctly**
  - Verify each check logged in `usage_logs`
  - Verify IP and UA hashes stored (not original values)
  - Verify check_type ('free' or 'paid') recorded correctly

- [ ] **Package purchases recorded**
  - Verify `package_purchases` table updated on successful payment
  - Verify Stripe payment intent ID stored
  - Verify package type and checks purchased recorded

### 7. UI/UX Testing
- [ ] **Usage counter displays correctly**
  - Verify free checks progress bar updates
  - Verify paid checks counter shows remaining
  - Verify check type indicator (free/paid) appears

- [ ] **Paywall modal shows correct packages**
  - Verify 3 packages displayed with correct pricing
  - Verify "Best Value" highlighted on Value Pack
  - Verify price per check calculations correct

- [ ] **Pricing page functionality**
  - Verify all 3 packages displayed
  - Verify purchase buttons work
  - Verify loading states during checkout

### 8. Edge Cases
- [ ] **Guest purchases work**
  - Complete purchase without account
  - Verify checks added to anonymous user
  - Verify checks persist across sessions

- [ ] **Mixed free and paid usage**
  - Use 2 free checks
  - Purchase package
  - Use 1 more free check (should use paid)
  - Verify correct check type logged

- [ ] **Database rollback on payment failure**
  - Simulate Stripe webhook failure
  - Verify checks not added to account
  - Verify purchase not recorded

## Automated Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm test freemium-enhanced.test.ts
npm test api.check.test.ts
npm test freemium.guard.test.ts

# Run with coverage
npm test -- --coverage
```

## Manual Testing Checklist

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Device Testing
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Large desktop (2560x1440)

### Network Testing
- [ ] Fast 3G
- [ ] Slow 3G
- [ ] Offline (should show cached content)
- [ ] High latency (200ms+)

## Security Testing

### Rate Limiting
- [ ] Test 10 requests/minute (should pass)
- [ ] Test 11 requests/minute (should fail)
- [ ] Test rate limit reset after 1 hour

### Abuse Detection
- [ ] Test 20+ requests from same IP
- [ ] Test 5+ different user agents from same IP
- [ ] Test rapid-fire requests (DoS simulation)

### Privacy Compliance
- [ ] Verify no PII stored in plain text
- [ ] Verify IP/UA hashing is irreversible
- [ ] Verify GDPR compliance for EU users
- [ ] Verify CCPA compliance for CA users

## Performance Testing

### Load Testing
- [ ] 100 concurrent users
- [ ] 1000 requests/hour per IP
- [ ] Database query performance
- [ ] Stripe webhook processing time

### Stress Testing
- [ ] Maximum file size (8MB)
- [ ] Large number of concurrent uploads
- [ ] Database connection limits
- [ ] Memory usage under load

## Monitoring and Alerts

### Key Metrics to Monitor
- Free checks used per week
- Paid package purchases
- Abuse detection triggers
- Rate limit violations
- Payment failures
- Database performance

### Alert Thresholds
- > 50 abuse detections per hour
- > 100 rate limit violations per hour
- > 10% payment failure rate
- > 5 second database query time
- > 90% memory usage


