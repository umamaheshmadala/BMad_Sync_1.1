// Platform config helpers — persisted in DB with sane defaults

import { createSupabaseClient } from './supabaseClient';

export type PlatformConfig = Record<string, { value: unknown }>;

const DEFAULT_CONFIG: PlatformConfig = {
  'billing.mode': { value: 'dummy' },
  'billing.threshold': { value: 20000 },
  'notifications.promotions_per_hour': { value: 3 },
  'notifications.promotions_per_day': { value: 10 },
  'notifications.quiet_hours': { value: '21-08' },
  'coupon_sharing.cap_per_user_per_day': { value: 21 },
  'ads.carousel_slots': { value: 6 },
  'ads.rotation_sec': { value: 3 },
};

export async function readPlatformConfig(): Promise<PlatformConfig> {
  try {
    const supabase = createSupabaseClient(true);
    const { data, error } = await (supabase as any)
      .from('platform_config')
      .select('key_name, config_value');
    if (error) {
      // Fallback to defaults if table not present or any error
      return { ...DEFAULT_CONFIG };
    }
    const merged: PlatformConfig = { ...DEFAULT_CONFIG };
    for (const row of (data as Array<any>) || []) {
      if (!row?.key_name) continue;
      merged[row.key_name] = row.config_value ?? merged[row.key_name] ?? { value: null };
    }
    return merged;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function writePlatformConfig(partial: PlatformConfig): Promise<void> {
  const supabase = createSupabaseClient(true) as any;
  const entries = Object.entries(partial || {});
  for (const [key, val] of entries) {
    // Only accept known keys; ignore unknown keys silently for now
    const toStore = (DEFAULT_CONFIG as any)[key] !== undefined ? val : undefined;
    if (toStore === undefined) continue;
    // Upsert row-by-row to support our simple test mock client
    await supabase
      .from('platform_config')
      .upsert({ key_name: key, config_value: toStore }, { onConflict: 'key_name' });
  }
}
