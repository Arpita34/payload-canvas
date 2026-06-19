
# Kiddo SDUI — Server-Driven UI Homepage Renderer

A production-grade, configuration-driven React Native (Expo) homepage that renders **entirely** from a JSON payload. The server decides _what_ to show; the client decides _how_ to draw it — safely, fast, and without crashing on bad data.

> Built for the Kiddo Q-commerce assignment: a "dumb" rendering engine that ingests a heavy SDUI payload, builds the screen tree dynamically, injects live campaign themes, and dispatches declarative actions — with zero app-store release cycles.

---

## Quick Start

```bash
cd kiddo-sdui
npm install
npx expo start          # press 'w' for web, or scan the QR with Expo Go
```

```bash
npm test                # 15 unit tests (parser / overlay / cart) — all green
npm run typecheck       # tsc --noEmit, strict mode, 0 errors
```

---

## How requirements map to code

| Requirement | Where | 
|---|---|
| **A. Component Registry (hash-map Factory, no switch)** | [`src/registry/componentRegistry.ts`](src/registry/componentRegistry.ts) |
| **A. BANNER_HERO / PRODUCT_GRID_2X2 / DYNAMIC_COLLECTION** | [`src/components/blocks/`](src/components/blocks/) |
| **A. Resilience — unknown type dropped silently** | `resolveBlock()` → `null`, seeded `NEW_COMPONENT_V2` in `homepage.json` |
| **B. Nested horizontal list, momentum-safe** | [`DynamicCollection.tsx`](src/components/blocks/DynamicCollection.tsx) — horizontal FlashList, `nestedScrollEnabled` |
| **C. Universal `handleAction` dispatcher** | [`src/actions/dispatcher.ts`](src/actions/dispatcher.ts) |
| **D. Single vertical FlashList, memo, keyExtractor** | [`src/screens/HomeScreen.tsx`](src/screens/HomeScreen.tsx) |
| **Adv. A. 3 campaigns + FULL_SCREEN_OVERLAY (`pointerEvents="none"`)** | [`src/data/campaign-*.json`](src/data/), [`CampaignOverlay.tsx`](src/components/overlay/CampaignOverlay.tsx) |
| **Adv. B. OTA theming via Context** | [`src/theme/ThemeContext.tsx`](src/theme/ThemeContext.tsx) |
| **Adv. C. Render isolation on cart update** | [`ProductCard.tsx`](src/components/atoms/ProductCard.tsx) + [`cartStore.ts`](src/store/cartStore.ts) |
| **Ingestion-time defensive parsing** | [`src/engine/parsePayload.ts`](src/engine/parsePayload.ts) |

---

## Architecture

```
App.tsx
 └── ThemeProvider (OTA theme from active campaign payload)
      └── HomeScreen
           └── FlashList  ← ONE vertical list = the entire screen
                └── resolveBlock(type) → ComponentType | null   (hash-map factory)
                     └── BlockErrorBoundary
                          └── <BannerHero | ProductGrid2x2 | DynamicCollection | EventBooking>
                               └── ProductCard / BookingCard (Zustand narrow selector)
      └── CampaignOverlay (pointerEvents="none", fails gracefully on dead asset)

Ingestion:  raw JSON ──▶ parseHomePayload() ──▶ guaranteed-safe HomePayload ──▶ store
```

### Three layers of defensive resilience

| Layer | Catches | Mechanism |
|---|---|---|
| **1. Parse-time** ([`parsePayload.ts`](src/engine/parsePayload.ts)) | corrupt metadata, missing `id`/`type`, `null` nodes, duplicate ids, bad theme | normalized/dropped **before** React sees it |
| **2. Registry** ([`componentRegistry.ts`](src/registry/componentRegistry.ts)) | unknown block types (`NEW_COMPONENT_V2`) | `resolveBlock()` returns `null` → dropped |
| **3. Render-time** ([`BlockErrorBoundary.tsx`](src/components/BlockErrorBoundary.tsx)) | a known block that throws mid-render | error boundary → blank slot, rest of tree survives |

`homepage.json` intentionally ships **four corrupt/edge blocks** (missing-id, `null`, duplicate-id, unknown-type) so every layer is provably exercised. The homepage still renders perfectly.

---

## Component Registry (Hash-Map Factory)

The rendering engine **never** has a `switch (block.type)`. A hash-map maps type strings → components:

```ts
const REGISTRY = {
  BANNER_HERO:        BannerHero,
  PRODUCT_GRID_2X2:   ProductGrid2x2,
  DYNAMIC_COLLECTION: DynamicCollection,
  EVENT_BOOKING:      EventBooking,
};

resolveBlock(type) // → component or null
```

Adding a new block type = **one line** in the registry, zero engine changes. (`EVENT_BOOKING`, the Summer-campaign booking row, was added exactly this way.)

---

## Render Isolation Proof

**Claim:** Tapping "Add to Cart" on one product updates only that card + the header badge. The other 30+ blocks stay frozen.

**How to see it live:** every block/card draws a tiny `↻N` render counter ([`src/dev/renderCount.tsx`](src/dev/renderCount.tsx), DEV-only). Add a product → only that `ProductCard`'s counter and the header badge tick up. Everything else stays put.

**Why it works:**
- `ProductCard` uses `useCartStore((s) => s.items[product.id] ?? 0)` — a narrow selector.
- Header badge uses `useCartStore((s) => s.count)` — narrow selector.
- Every block & atom is wrapped in `React.memo`.
- Zustand only notifies listeners whose **selected slice** actually changed.

---

## Live Campaigns

Tap the campaign switcher in the header to swap the entire payload (theme + blocks + overlay) instantly — simulating a CMS push, no rebuild.

| Campaign | Theme | Overlay (`FULL_SCREEN_OVERLAY`) | Signature block |
|---|---|---|---|
| 🏠 Home | Orange `#FF9933` | — | — |
| ✏️ Back to School | Yellow `#F5C500` + Blue | Lottie (paper airplanes/pencils) | "Lunchboxes & Bags" row |
| 🌊 Summer Playhouse | Ocean Blue `#0891B2` | WebP/image splash wash | `EVENT_BOOKING` (Petting Zoo tickets) |
| 🎪 Mystery Gift Carnival | Carnival Red `#DC2626` | Lottie confetti | `APPLY_MYSTERY_GIFT_COUPON` rows |

The overlay accepts the canonical server node and normalizes it via `resolveOverlay()`:

```json
{ "type": "FULL_SCREEN_OVERLAY", "animation_url": "https://.../confetti.json" }
```

`pointerEvents="none"` lets every tap/scroll pass through to the UI underneath. A dead/unreachable asset URL fails silently (`onAnimationFailure` / `onError`) — the overlay is decorative and must never block the app. Remote media is cached via `expo-image` (`memory-disk`).

---

## Performance Architecture

- **Single `FlashList`** for the whole screen — no `ScrollView` + `.map()`.
- **`getItemType`** → separate recycling pools per block type, no view mismatches.
- **`keyExtractor` = `block.id`** (never array index) → stable identity & recycling.
- **`React.memo`** on every block and atom.
- **Nested horizontal `FlashList`** in `DynamicCollection` / `EventBooking` virtualizes independently; `nestedScrollEnabled` keeps the vertical master list's momentum on Android.
- **`useCallback`** on `renderItem` / `keyExtractor` → stable refs, no needless re-renders.

---

## Testing

```bash
npm test
```

15 unit tests (ts-jest, node env — pure logic, no native modules):
- **`parsePayload.test.ts`** — corrupt blocks dropped, never throws on garbage input, theme fallbacks, overlay normalization.
- **`resolveOverlay.test.ts`** — all overlay shapes + malformed → null.
- **`cartStore.test.ts`** — add/remove/count math, no negative counts, clear.

---

## TypeScript Strategy

- `strict: true` + `isolatedModules: true`.
- `Action` is a **discriminated union**; the dispatcher's `default` branch asserts `const _exhaustiveCheck: never = action`, so a new action type fails compilation until handled.
- `Block<T, D>` generic strongly links `type` ↔ `data`.
- Untrusted JSON enters as `unknown` and is narrowed inside `parseHomePayload` — **no `as HomePayload` casts**. The only intentional `any` is at the registry dispatch boundary.

---

## Folder Structure

```
kiddo-sdui/
├── App.tsx                              # Root: ThemeProvider + CampaignOverlay
├── jest.config.js
├── src/
│   ├── types/schema.ts                  # All types + resolveOverlay()
│   ├── engine/parsePayload.ts           # Ingestion-time defensive parser
│   ├── data/                            # homepage + 3 campaign payloads
│   ├── registry/componentRegistry.ts   # Hash-map factory
│   ├── actions/dispatcher.ts           # handleAction(action)
│   ├── theme/ThemeContext.tsx           # OTA theme provider
│   ├── store/{cartStore,campaignStore}.ts
│   ├── components/
│   │   ├── BlockErrorBoundary.tsx
│   │   ├── blocks/{BannerHero,ProductGrid2x2,DynamicCollection,EventBooking}.tsx
│   │   ├── atoms/{ProductCard,CTAButton}.tsx
│   │   └── overlay/CampaignOverlay.tsx
│   ├── dev/renderCount.tsx              # render-isolation instrumentation
│   ├── screens/HomeScreen.tsx
│   └── __tests__/                       # parser / overlay / cart tests
```

---

## 📽️ Demo

Engineering-proof clips (Google Drive — click to play):

| Clip | Shows |
|---|---|
| [▶ 1 — Render Isolation](https://drive.google.com/file/d/1j3VHvMxZPrMmJWtknhNFtPcQknxKk1LD/view?usp=sharing) | Add to cart on one card → only its `↻` counter + header badge update; 30+ blocks stay frozen |
| [▶ 2 — Scroll Performance](https://drive.google.com/file/d/191hdc5nHAvFVQtZ6Mg9KGP9XvI3JL_CE/view?usp=sharing) | Nested horizontal carousel drag + vertical scroll, both smooth, momentum intact |
| [▶ 3 — Resilience](https://drive.google.com/file/d/196qFTBzVCZop7yIr_nTicP_OLe8iKqzz/view?usp=sharing) | 4 corrupt blocks in the payload (unknown type, missing id, null, duplicate id) — screen still renders perfectly, zero crash |

> The same clips are also committed under [`demo/`](demo/).

---

## Submission checklist

- [x] Strict TypeScript, `npm run typecheck` clean
- [x] `npm test` green (15 tests)
- [x] 3 distinct live campaigns + base home
- [x] Three-layer resilience (parse / registry / error boundary)
- [x] Render-isolation instrumentation (`↻` badges)
- [x] Demo clips committed under [`demo/`](demo/)
