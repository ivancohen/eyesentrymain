# Supabase Client Usage Guidelines

## Client Configuration

The main Supabase client is configured in `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const getSupabaseClient = () => supabase;
```

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

## Client Usage Guidelines

### Regular Client Usage

Use the regular client (`@/lib/supabase`) for:
- Regular user operations
- CRUD operations on tables with RLS policies
- Reading public data
- User authentication
- Real-time subscriptions

Example:
```typescript
import { supabase } from "@/lib/supabase";

// Regular user operations
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

### Service Role Key Usage

Use the service role key for:
- Admin operations (create/delete users)
- Bypassing RLS policies
- Database migrations
- Emergency fixes
- System-level operations

Example:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin operations
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'admin@example.com',
  password: 'secure-password'
});
```

## Security Guidelines

1. **Never expose the service role key**:
   - Keep it in environment variables
   - Never commit it to version control
   - Never expose it in client-side code

2. **Use appropriate client for operations**:
   - Use regular client for user operations
   - Use service role key only when necessary
   - Document why service role key is needed

3. **RLS Policies**:
   - Regular client respects RLS policies
   - Service role key bypasses RLS
   - Use RLS policies as primary security mechanism

## Common Operations

### User Management
```typescript
// Create user (requires service role)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password'
});

// Delete user (requires service role)
const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
```

### Database Operations
```typescript
// Regular operations (respects RLS)
const { data, error } = await supabase
  .from('table')
  .select('*');

// Admin operations (bypasses RLS)
const { data, error } = await supabaseAdmin
  .from('table')
  .select('*');
```

## Troubleshooting

1. **Permission Errors**:
   - Check if using correct client
   - Verify RLS policies
   - Ensure service role key is used for admin operations

2. **Authentication Issues**:
   - Verify environment variables
   - Check client configuration
   - Ensure correct auth flow is used

3. **Database Access**:
   - Regular client: Check RLS policies
   - Service role: Verify key permissions
   - Check table permissions in Supabase dashboard 