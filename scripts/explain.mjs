/**
 * Simple EXPLAIN baseline checks against Supabase (Postgres)
 * Env:
 *  - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supa = createClient(url, key, { auth: { persistSession: false } });

async function explain(sql) {
  const { data, error } = await supa.rpc('explain', { sql_text: sql });
  if (error) throw error;
  return data;
}

async function main() {
  // Create helper function if not exists
  await supa.rpc('exec_sql', { sql_text: `
    do $$ begin
      if not exists (select 1 from pg_proc where proname = 'explain') then
        create or replace function public.explain(sql_text text)
        returns text language plpgsql as $$
        declare r record; out text := '';
        begin
          for r in execute 'EXPLAIN ' || sql_text loop
            out := out || r."QUERY PLAN" || E'\n';
          end loop; return out;
        end
        $$;
      end if;
    end $$;
  ` }).catch(() => {});

  const queries = [
    `select created_at, recommend_status, business_id from business_reviews where created_at >= now() - interval '7 days'`,
    `select collected_at, is_redeemed, coupon_id from user_coupons where collected_at >= now() - interval '7 days'`,
    `select id, message, notification_type, created_at, read_at from notifications where recipient_user_id = '00000000-0000-0000-0000-000000000000' order by created_at desc limit 50`,
  ];
  const rowsThreshold = Number(process.env.EXPLAIN_MAX_ROWS || '200000');
  const strict = String(process.env.EXPLAIN_STRICT || '').toLowerCase() === 'true';
  let exceeded = false;
  for (const q of queries) {
    try {
      const plan = await explain(q);
      console.log('EXPLAIN for:', q);
      console.log(plan);
      // crude parse of row estimates
      const rowEstimates = Array.from(plan.matchAll(/rows=(\d+)/g)).map((m) => Number(m[1]));
      const maxRows = rowEstimates.length ? Math.max(...rowEstimates) : 0;
      if (rowsThreshold && maxRows > rowsThreshold) {
        exceeded = true;
        console.warn(`PLAN ROWS WARNING: max rows ${maxRows} exceeds threshold ${rowsThreshold}`);
      }
    } catch (e) {
      console.error('EXPLAIN error for query:', q, e?.message || e);
    }
  }
  if (exceeded && strict) {
    console.error('EXPLAIN_STRICT=true and thresholds exceeded — failing');
    process.exit(1);
  }
}

main();


