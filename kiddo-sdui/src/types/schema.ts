// ============================================================
// src/types/schema.ts
// Complete TypeScript contract for the SDUI payload.
// strict: true — no any leaks outside the registry boundary.
// ============================================================

// ---- Actions: discriminated union. Safety contract. ----
export type Action =
  | { type: 'ADD_TO_CART';               payload: { id: string } }
  | { type: 'DEEP_LINK';                 payload: { url: string } }
  | { type: 'APPLY_MYSTERY_GIFT_COUPON'; payload: { code: string } }
  | { type: 'OPEN_BOOKING';              payload: { eventId: string } };

export interface Product {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  imageUrl: string;
  badge?: string;
  action: Action;
}

export interface Theme {
  primary: string;
  background: string;
  text: string;
  accent: string;
  cardBg?: string;
  subtitleText?: string;
}

// ---- Generic block: keeps type and data strongly linked ----
export interface Block<T extends string = string, D = unknown> {
  id: string;
  type: T;
  data: D;
}

// ---- Concrete block types ----
export type BannerHeroBlock = Block<
  'BANNER_HERO',
  {
    imageUrl: string;
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    action: Action;
  }
>;

export type ProductGridBlock = Block<
  'PRODUCT_GRID_2X2',
  {
    title: string;
    products: Product[];
  }
>;

export type DynamicCollBlock = Block<
  'DYNAMIC_COLLECTION',
  {
    title: string;
    themeTag: string;
    products: Product[];
  }
>;

// ---- Specialty booking block (e.g. 'Petting Zoo Tickets') ----
export interface BookingEvent {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  mrp?: number;
  badge?: string;
  /** Always an OPEN_BOOKING action in practice, but typed as Action for safety. */
  action: Action;
}

export type EventBookingBlock = Block<
  'EVENT_BOOKING',
  {
    title: string;
    events: BookingEvent[];
  }
>;

export type KnownBlock =
  | BannerHeroBlock
  | ProductGridBlock
  | DynamicCollBlock
  | EventBookingBlock;

// ---- Campaign overlay (embedded inside campaign JSONs) ----
// Canonical server contract (per assignment spec):
//   { "type": "FULL_SCREEN_OVERLAY", "animation_url": "..." }
// Legacy explicit forms are also accepted for back-compat.
export type OverlayMedia = 'lottie' | 'image';

export type CampaignOverlayConfig =
  | { type: 'FULL_SCREEN_OVERLAY'; animation_url: string; media?: OverlayMedia }
  | { type: 'LOTTIE'; url: string }
  | { type: 'WEBP'; url: string };

/** Normalized overlay shape the renderer actually consumes. */
export interface ResolvedOverlay {
  kind: OverlayMedia;
  url: string;
}

/**
 * Defensively normalizes any accepted overlay config into { kind, url }.
 * Unknown / malformed configs resolve to null → overlay simply not rendered.
 */
export function resolveOverlay(
  config: CampaignOverlayConfig | null | undefined
): ResolvedOverlay | null {
  if (!config || typeof config !== 'object') return null;

  if (config.type === 'LOTTIE') {
    return config.url ? { kind: 'lottie', url: config.url } : null;
  }
  if (config.type === 'WEBP') {
    return config.url ? { kind: 'image', url: config.url } : null;
  }
  if (config.type === 'FULL_SCREEN_OVERLAY') {
    const url = config.animation_url;
    if (!url) return null;
    const kind: OverlayMedia =
      config.media ?? (url.toLowerCase().endsWith('.json') ? 'lottie' : 'image');
    return { kind, url };
  }
  return null;
}

// ---- Top-level payload ----
export interface HomePayload {
  screenId: string;
  version: number;
  theme: Theme;
  campaign: string | null;
  campaignOverlay?: CampaignOverlayConfig;
  blocks: Block[]; // raw, untrusted — could contain unknown types
}
