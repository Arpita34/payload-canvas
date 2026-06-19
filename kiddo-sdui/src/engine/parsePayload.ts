// ============================================================
// src/engine/parsePayload.ts
// Ingestion-time defensive parser for the SDUI payload.
//
// The server payload is UNTRUSTED. Before a single pixel is drawn we
// normalize it into a guaranteed-safe HomePayload:
//   - missing / wrong-typed theme fields  → safe fallbacks
//   - blocks that are not objects          → dropped
//   - blocks missing a string id or type   → dropped
//   - duplicate block ids                  → dropped (keyExtractor stability)
//   - missing data                         → defaulted to {}
//
// This is the FIRST resilience layer. The registry (unknown type → null)
// and the per-block error boundary (render throw → blank slot) are the
// second and third. Corrupt metadata never reaches React.
// ============================================================

import {
  Block,
  CampaignOverlayConfig,
  HomePayload,
  OverlayMedia,
  Theme,
} from '../types/schema';

/** Last-resort theme so the screen is always renderable. */
const FALLBACK_THEME: Theme = {
  primary: '#FF9933',
  background: '#FFFFFF',
  text: '#1A1A1A',
  accent: '#1E5AA8',
  cardBg: '#FFFFFF',
  subtitleText: '#666666',
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): v is string {
  return typeof v === 'string';
}

/** Dev-only warning — safe even when __DEV__ is undefined (e.g. Jest/node). */
function warn(message: string, extra?: unknown): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[SDUI:parse] ${message}`, extra ?? '');
  }
}

function parseTheme(raw: unknown): Theme {
  if (!isObject(raw)) {
    warn('theme missing or malformed — using fallback theme');
    return FALLBACK_THEME;
  }
  return {
    primary: str(raw.primary) ? raw.primary : FALLBACK_THEME.primary,
    background: str(raw.background) ? raw.background : FALLBACK_THEME.background,
    text: str(raw.text) ? raw.text : FALLBACK_THEME.text,
    accent: str(raw.accent) ? raw.accent : FALLBACK_THEME.accent,
    cardBg: str(raw.cardBg) ? raw.cardBg : FALLBACK_THEME.cardBg,
    subtitleText: str(raw.subtitleText) ? raw.subtitleText : FALLBACK_THEME.subtitleText,
  };
}

function parseOverlay(raw: unknown): CampaignOverlayConfig | undefined {
  if (!isObject(raw)) return undefined;

  if (raw.type === 'FULL_SCREEN_OVERLAY' && str(raw.animation_url)) {
    const media: OverlayMedia | undefined =
      raw.media === 'lottie' || raw.media === 'image' ? raw.media : undefined;
    return media
      ? { type: 'FULL_SCREEN_OVERLAY', animation_url: raw.animation_url, media }
      : { type: 'FULL_SCREEN_OVERLAY', animation_url: raw.animation_url };
  }
  if (raw.type === 'LOTTIE' && str(raw.url)) return { type: 'LOTTIE', url: raw.url };
  if (raw.type === 'WEBP' && str(raw.url)) return { type: 'WEBP', url: raw.url };

  warn('overlay config malformed — overlay disabled', raw);
  return undefined;
}

function parseBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) {
    warn('blocks is not an array — rendering empty screen');
    return [];
  }

  const seen = new Set<string>();
  const blocks: Block[] = [];

  for (const node of raw) {
    if (!isObject(node)) {
      warn('dropped a non-object block node', node);
      continue;
    }
    if (!str(node.id) || node.id.length === 0) {
      warn('dropped a block with missing/invalid id', node);
      continue;
    }
    if (!str(node.type) || node.type.length === 0) {
      warn(`dropped block "${node.id}" with missing/invalid type`);
      continue;
    }
    if (seen.has(node.id)) {
      warn(`dropped duplicate block id "${node.id}" (keyExtractor stability)`);
      continue;
    }
    seen.add(node.id);
    blocks.push({
      id: node.id,
      type: node.type,
      // data may legitimately be any shape; default to {} so block components
      // can read it without null-guarding the container itself.
      data: 'data' in node ? node.data : {},
    });
  }

  return blocks;
}

/**
 * Normalizes an untrusted raw payload into a guaranteed-safe HomePayload.
 * Never throws. The worst case is an empty-but-renderable screen.
 */
export function parseHomePayload(raw: unknown): HomePayload {
  if (!isObject(raw)) {
    warn('payload is not an object — returning empty screen');
    return {
      screenId: 'unknown',
      version: 0,
      theme: FALLBACK_THEME,
      campaign: null,
      blocks: [],
    };
  }

  return {
    screenId: str(raw.screenId) ? raw.screenId : 'unknown',
    version: typeof raw.version === 'number' ? raw.version : 0,
    theme: parseTheme(raw.theme),
    campaign: str(raw.campaign) ? raw.campaign : null,
    campaignOverlay: parseOverlay(raw.campaignOverlay),
    blocks: parseBlocks(raw.blocks),
  };
}
