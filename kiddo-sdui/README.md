# Kiddo SDUI — Server-Driven UI Homepage Renderer

A production-grade, configuration-driven React Native (Expo) homepage that renders entirely from a JSON payload. The server decides *what* to show; the client decides *how* to draw it — safely, fast, and without crashing on bad data.

---

## Quick Start

```bash
cd kiddo-sdui
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone, or press `w` for web.

---

## Architecture

```
App.tsx
 └── ThemeProvider (reads theme from active campaign payload)
      └── HomeScreen
           └── FlashList (one vertical list, entire screen)
                └── resolveBlock(type) → ComponentType | null
                     └── BlockErrorBoundary
                          └── <BannerHero | ProductGrid2x2 | DynamicCollection>
                               └── ProductCard (Zustand narrow selector)
      └── CampaignOverlay (pointerEvents="none")
```

### Key Design Decisions

| Requirement | Solution |
|---|---|
| Never crash on unknown blocks | `resolveBlock()` returns `null` → dropped silently |
| Never crash on malformed data | `BlockErrorBoundary` wraps every block |
| Zero re-renders on cart update | Zustand narrow selectors per product |
| OTA theme changes | `ThemeContext` reads from payload; swap payload = recolor |
| High frame rate | Single `FlashList`, `React.memo`, `getItemType`, `useCallback` |
| Campaign switch | Swap Zustand campaign store → new payload, theme, overlay |

---

## Component Registry (Hash-Map Factory)

```
src/registry/componentRegistry.ts
```

The rendering engine **never** has a `switch (block.type)`. Instead, a hash-map maps type strings → components:

```ts
const REGISTRY = {
  BANNER_HERO:        BannerHero,
  PRODUCT_GRID_2X2:   ProductGrid2x2,
  DYNAMIC_COLLECTION: DynamicCollection,
};

resolveBlock(type) // returns component or null
```

Adding a new block type = **one line** in the registry, zero engine changes.

---

## Resilience Tests

### Unknown block type
The `homepage.json` includes `"type": "NEW_COMPONENT_V2"`. The registry returns `null`, a DEV warning is logged, and the rest of the screen renders normally.

### Malformed known block
If a block has `products: null`, `BlockErrorBoundary` catches the render error and renders a blank slot (invisible in production, yellow placeholder in dev). No white screen.

---

## Render Isolation Proof

**Claim:** Tapping "Add to Cart" on one product updates only that card + the header badge. The other 30+ blocks stay frozen.

**How to verify:**
1. Open React Native DevTools or add `console.log` render counters to each block.
2. Add a product to cart.
3. Only `ProductCard` (for that product) and the header badge counter increment.
4. All other block components log nothing.

**Why it works:**
- `ProductCard` uses `useCartStore((s) => s.items[product.id] ?? 0)` — a narrow selector.
- Cart badge uses `useCartStore((s) => s.count)` — narrow selector.
- All other components subscribe to nothing from the cart store.
- `React.memo` on every block ensures props-equality checks prevent re-renders.
- Zustand only calls listeners whose selected slice changed.

---

## Live Campaigns

Tap the campaign switcher buttons in the app header to switch instantly:

| Campaign | Theme | Overlay |
|---|---|---|
| 🏠 Home | Orange `#FF9933` | None |
| ✏️ Back to School | Yellow `#F5C500` | Lottie (paper airplanes) |
| 🌊 Summer Playhouse | Ocean Blue `#0891B2` | WebP (beach, subtle wash) |
| 🎪 Mystery Gift Carnival | Carnival Red `#DC2626` | Lottie (confetti) |

**No app rebuild required.** The entire payload (theme + blocks + overlay) is swapped from local JSON, simulating what a real CMS push would do.

---

## Performance Architecture

- **Single `FlashList`**: The entire screen is one virtualized list. No `ScrollView` + `.map()`.
- **`getItemType`**: FlashList maintains separate recycling pools per block type → no view mismatches.
- **`keyExtractor`**: Uses `block.id` (never array index) → stable view identity, correct recycling.
- **`React.memo`** on every block and atom → only re-renders when props change.
- **Nested horizontal `FlashList`** in `DynamicCollection`: virtualizes independently from the vertical list. Horizontal gesture ownership is separate from vertical, preserving scroll momentum on both axes.
- **`useCallback`** on `renderItem` and `keyExtractor` → stable references, no unnecessary FlashList re-renders.

---

## Folder Structure

```
kiddo-sdui/
├── App.tsx                              # Root: ThemeProvider + CampaignOverlay
├── src/
│   ├── types/schema.ts                  # All TypeScript interfaces
│   ├── data/
│   │   ├── homepage.json                # Base payload (includes unknown block)
│   │   ├── campaign-backToSchool.json
│   │   ├── campaign-summerPlayhouse.json
│   │   └── campaign-mysteryGift.json
│   ├── registry/componentRegistry.ts   # Hash-map factory
│   ├── actions/dispatcher.ts           # handleAction(action)
│   ├── theme/ThemeContext.tsx           # OTA theme provider
│   ├── store/
│   │   ├── cartStore.ts                 # Zustand cart (narrow selectors)
│   │   └── campaignStore.ts             # Zustand active campaign
│   ├── components/
│   │   ├── BlockErrorBoundary.tsx
│   │   ├── blocks/
│   │   │   ├── BannerHero.tsx
│   │   │   ├── ProductGrid2x2.tsx
│   │   │   └── DynamicCollection.tsx
│   │   ├── atoms/
│   │   │   ├── ProductCard.tsx
│   │   │   └── CTAButton.tsx
│   │   └── overlay/
│   │       └── CampaignOverlay.tsx
│   └── screens/HomeScreen.tsx
```

---

## TypeScript Strategy

- `strict: true` in `tsconfig.json`
- `Action` is a **discriminated union** — the dispatcher's `default` branch has `const _exhaustiveCheck: never = action`, so TS errors if a new action type is added without handling it.
- `Block<T, D>` generic links `type` and `data` strongly.
- `resolveBlock` uses `ComponentType<BlockProps<any>>` only at the registry boundary — the only intentional `any` in the codebase, isolated to the dynamic dispatch boundary.

---

## Common Mistakes Avoided

| ❌ Anti-pattern | ✅ Used instead |
|---|---|
| `<ScrollView>` + `.map()` | Single `FlashList` |
| `switch (block.type)` in renderer | Hash-map registry |
| Cart in React Context | Zustand narrow selectors |
| Missing `pointerEvents="none"` | `<CampaignOverlay>` has it |
| `keyExtractor={(_, i) => i}` | `keyExtractor={(b) => b.id}` |
| `any` everywhere | Strict types, `any` only at registry boundary |
| App crash on missing field | Error boundary + null guards |
