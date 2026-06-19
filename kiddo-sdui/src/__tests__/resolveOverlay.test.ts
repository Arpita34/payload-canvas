import { resolveOverlay } from '../types/schema';

describe('resolveOverlay — overlay schema normalization', () => {
  it('infers lottie from a .json animation_url', () => {
    expect(
      resolveOverlay({ type: 'FULL_SCREEN_OVERLAY', animation_url: 'https://x/confetti.json' })
    ).toEqual({ kind: 'lottie', url: 'https://x/confetti.json' });
  });

  it('infers image from a non-json animation_url', () => {
    expect(
      resolveOverlay({ type: 'FULL_SCREEN_OVERLAY', animation_url: 'https://x/splash.webp' })
    ).toEqual({ kind: 'image', url: 'https://x/splash.webp' });
  });

  it('honors an explicit media override', () => {
    expect(
      resolveOverlay({ type: 'FULL_SCREEN_OVERLAY', animation_url: 'https://x/a', media: 'image' })
    ).toEqual({ kind: 'image', url: 'https://x/a' });
  });

  it('supports legacy LOTTIE and WEBP forms', () => {
    expect(resolveOverlay({ type: 'LOTTIE', url: 'https://x/a.json' })).toEqual({
      kind: 'lottie',
      url: 'https://x/a.json',
    });
    expect(resolveOverlay({ type: 'WEBP', url: 'https://x/a.webp' })).toEqual({
      kind: 'image',
      url: 'https://x/a.webp',
    });
  });

  it('returns null for null/undefined/malformed configs', () => {
    expect(resolveOverlay(null)).toBeNull();
    expect(resolveOverlay(undefined)).toBeNull();
    // @ts-expect-error — intentionally malformed runtime input
    expect(resolveOverlay({ type: 'FULL_SCREEN_OVERLAY' })).toBeNull();
  });
});
