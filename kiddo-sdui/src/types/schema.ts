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

export type KnownBlock = BannerHeroBlock | ProductGridBlock | DynamicCollBlock;

// ---- Campaign overlay (embedded inside campaign JSONs) ----
export interface CampaignOverlayConfig {
  type: 'LOTTIE' | 'WEBP';
  url: string;
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
