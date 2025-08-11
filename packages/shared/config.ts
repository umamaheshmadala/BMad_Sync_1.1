// Scaffold: platform_config read/write stubs

export type PlatformConfig = Record<string, { value: unknown }>;

export async function readPlatformConfig(): Promise<PlatformConfig> {
  return {
    'billing.mode': { value: 'dummy' },
    'billing.threshold': { value: 20000 },
    'notifications.promotions_per_hour': { value: 3 },
    'notifications.promotions_per_day': { value: 10 },
    'notifications.quiet_hours': { value: '21-08' },
    'coupon_sharing.cap_per_user_per_day': { value: 21 },
    'ads.carousel_slots': { value: 6 },
    'ads.rotation_sec': { value: 3 },
  };
}

export async function writePlatformConfig(_partial: PlatformConfig): Promise<void> {
  // no-op scaffold
}
