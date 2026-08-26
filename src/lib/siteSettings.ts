/**
 * siteSettings.ts — cached server reads of the SiteSetting collection.
 *
 * The /api/settings route owns writes; every write busts SITE_SETTINGS_TAG so
 * these cached reads refresh on the next request. Import from Server
 * Components and Route Handlers only.
 */

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { SITE_SETTINGS_TAG } from '@/lib/fetcher';

/** Mirrors DEFAULT_SETTINGS['store'] in /api/settings. */
const DEFAULT_FREE_DELIVERY_THRESHOLD = 100;

export interface StoreSettings {
  freeShippingThreshold: number;
  currencySymbol: string;
}

export interface SiteIdentity {
  contactPhone: string;
  contactEmail: string;
  address: string;
  /** Plain @handle or full https URL — empty string = hidden. */
  whatsapp: string;
  instagram: string;
  facebook: string;
  youtube: string;
}

/** Matches DEFAULT_SETTINGS['site'] in /api/settings. */
export const EMPTY_SITE_IDENTITY: SiteIdentity = {
  contactPhone: '',
  contactEmail: '',
  address: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  youtube: ''
};

function parseStore(value: unknown): StoreSettings {
  const store = (value ?? {}) as Record<string, unknown>;
  const threshold = Number(store.freeShippingThreshold);
  return {
    freeShippingThreshold:
      Number.isFinite(threshold) && threshold >= 0 ? threshold : DEFAULT_FREE_DELIVERY_THRESHOLD,
    currencySymbol: typeof store.currencySymbol === 'string' ? store.currencySymbol : '৳ BDT',
  };
}

export const getStoreSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'store' } });
    // Absent row → defaults (the API seeds on first read; here we just degrade).
    return parseStore(row?.value);
  },
  ['settings:store'],
  { tags: [SITE_SETTINGS_TAG], revalidate: 3600 }
);

/**
 * `getStoreSettings()` with built-in fallback — pages must never 500 over a
 * settings read.
 */
export async function getStoreSettingsSafe(): Promise<StoreSettings> {
  try {
    return await getStoreSettings();
  } catch (err) {
    console.error('[settings] store read failed:', err);
    return parseStore(null);
  }
}

function parseIdentity(value: unknown): SiteIdentity {
  const site = (value ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    contactPhone: str(site.contactPhone),
    contactEmail: str(site.contactEmail),
    address: str(site.address),
    whatsapp: str(site.whatsapp),
    instagram: str(site.instagram),
    facebook: str(site.facebook),
    youtube: str(site.youtube),
  };
}

export const getSiteIdentity = unstable_cache(
  async (): Promise<SiteIdentity> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'site' } });
    return parseIdentity(row?.value);
  },
  ['settings:site'],
  { tags: [SITE_SETTINGS_TAG], revalidate: 3600 }
);

/** `getSiteIdentity()` with built-in fallback (all-empty identity). */
export async function getSiteIdentitySafe(): Promise<SiteIdentity> {
  try {
    return await getSiteIdentity();
  } catch (err) {
    console.error('[settings] site identity read failed:', err);
    return EMPTY_SITE_IDENTITY;
  }
}
