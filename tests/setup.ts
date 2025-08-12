import { vi } from 'vitest';
import { createMockSupabase, MockDb } from './helpers/mock-supabase';

// Ensure required env vars present (dummy values for tests)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-test';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-test';
// Enable dev auth endpoints for tests by default
process.env.FEATURE_DEV_AUTH = process.env.FEATURE_DEV_AUTH || 'true';

// Mock @supabase/supabase-js createClient to return our in-memory mock
const db = new MockDb();
const mockClient = createMockSupabase(db);

vi.mock('@supabase/supabase-js', async () => {
  return {
    createClient: () => mockClient,
  } as any;
});

// Export db for tests to seed/inspect
export { db };


