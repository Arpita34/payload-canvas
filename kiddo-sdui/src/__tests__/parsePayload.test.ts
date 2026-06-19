import { parseHomePayload } from '../engine/parsePayload';
import homepage from '../data/homepage.json';

describe('parseHomePayload — ingestion-time resilience', () => {
  it('drops corrupt blocks (missing id, null node, duplicate id) from the real payload', () => {
    const parsed = parseHomePayload(homepage);
    const ids = parsed.blocks.map((b) => b.id);

    // Valid blocks + the unknown-type block (which only fails later, at the registry) survive parse.
    expect(ids).toEqual(['b1', 'b2', 'b3', 'b9-unknown']);
    // The missing-id block, the null node, and the duplicate "b1" are gone.
    expect(ids.filter((id) => id === 'b1')).toHaveLength(1);
  });

  it('never throws on a totally invalid payload and returns a renderable empty screen', () => {
    for (const bad of [null, undefined, 42, 'nope', [], { blocks: 'not-an-array' }]) {
      const parsed = parseHomePayload(bad);
      expect(Array.isArray(parsed.blocks)).toBe(true);
      expect(parsed.blocks).toHaveLength(0);
      expect(typeof parsed.theme.primary).toBe('string'); // always a usable theme
    }
  });

  it('fills missing/wrong-typed theme fields with safe fallbacks', () => {
    const parsed = parseHomePayload({ theme: { primary: '#000000', background: 123 }, blocks: [] });
    expect(parsed.theme.primary).toBe('#000000'); // valid field kept
    expect(parsed.theme.background).toBe('#FFFFFF'); // invalid number → fallback
    expect(parsed.theme.text).toBe('#1A1A1A'); // missing → fallback
  });

  it('defaults missing block data to an empty object', () => {
    const parsed = parseHomePayload({ blocks: [{ id: 'x', type: 'BANNER_HERO' }] });
    expect(parsed.blocks[0].data).toEqual({});
  });

  it('normalizes the canonical FULL_SCREEN_OVERLAY node', () => {
    const parsed = parseHomePayload({
      blocks: [],
      campaignOverlay: { type: 'FULL_SCREEN_OVERLAY', animation_url: 'https://x/anim.json' },
    });
    expect(parsed.campaignOverlay).toEqual({
      type: 'FULL_SCREEN_OVERLAY',
      animation_url: 'https://x/anim.json',
    });
  });

  it('disables a malformed overlay instead of crashing', () => {
    const parsed = parseHomePayload({ blocks: [], campaignOverlay: { type: 'WAT' } });
    expect(parsed.campaignOverlay).toBeUndefined();
  });
});
