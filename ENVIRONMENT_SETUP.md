# Environment Variables Setup

## Required for Production

### Database
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Stripe (Required for payments)
```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Abuse Prevention (Required for production)
```bash
IP_HASH_SALT=your_secure_random_salt_for_ip_hashing
UA_HASH_SALT=your_secure_random_salt_for_user_agent_hashing
```

## Optional

### Authentication (for user accounts)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### OpenAI (for enhanced AI analysis)
```bash
OPENAI_API_KEY=sk-...
```

### Development
```bash
DISABLE_FREEMIUM_LIMITS=true
NODE_ENV=development
```

## Privacy Compliance Notes

- `IP_HASH_SALT` and `UA_HASH_SALT` should be long, random strings
- These salts ensure IP addresses and user agents cannot be reversed from hashes
- Required for GDPR/CCPA compliance when tracking anonymous users
- Generate with: `openssl rand -hex 32`

## Database Migration

Run the migration to add the new tables:
```bash
# Apply the migration in your Supabase dashboard or via CLI
# File: supabase_migrations/0002_package_system.sql
```




