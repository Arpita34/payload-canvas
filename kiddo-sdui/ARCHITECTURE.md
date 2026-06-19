# Architecture & Design Decisions

This document explains the _why_ behind the engineering choices, the trade-offs considered, and what a production hardening pass would add next.

## 1. Rendering engine: registry over switch

A `switch (block.type)` couples the renderer to every block type and grows unbounded. Instead, a **hash-map registry** (`type → Component`) gives O(1) lookup, keeps the renderer type-agnostic, and makes adding a block a one-line change. `resolveBlock()` returns `null` for unknown types, which the engine treats as "render nothing" — the core of structural resilience.

**Trade-off:** the registry value is typed `ComponentType<BlockProps<any>>`. That single `any` is the deliberate boundary between the dynamic (string-keyed) world and the statically-typed component world. Everything on either side stays strict.

## 2. Resilience in depth (three layers)

Resilience isn't one guard; it's defense in depth, because failures arrive at different stages:

1. **Parse-time** (`engine/parsePayload.ts`) — the payload is untrusted I/O. It's normalized into a guaranteed-safe `HomePayload` before anything else runs: bad theme fields get fallbacks, malformed/duplicate/idless blocks are dropped. This is the layer that satisfies "processing safety when handling corrupt metadata."
2. **Registry** — structurally valid but _unknown_ block types are dropped at lookup.
3. **Error boundary** — a known block that throws during render is isolated to a blank slot; siblings are untouched.

Each layer catches what the previous one can't. `homepage.json` ships seeded corrupt blocks so all three are demonstrably exercised, and `parsePayload.test.ts` locks the behavior in.

**Trade-off:** the parser is hand-written (no `zod`) to keep the dependency surface minimal and the bundle light. For a larger schema, `zod`/`valibot` would give declarative schemas and richer error reporting at the cost of bundle size.

## 3. State: Zustand with narrow selectors, not Context

The cart could live in React Context — but any Context value change re-renders **all** consumers. With 30+ blocks that's a frame killer. Zustand lets each `ProductCard` subscribe to _only_ its own slice (`items[id]`), so adding to cart re-renders exactly one card + the header counter. `React.memo` on every block backs this up at the props layer.

The theme _does_ use Context — intentionally. A theme change is a campaign switch, a rare event where re-coloring the whole tree is correct and desired.

## 4. Lists: one vertical FlashList, nested horizontal FlashLists

The entire screen is a single virtualized `FlashList` (not `ScrollView` + map), so off-screen blocks are recycled. `getItemType` keeps per-type recycling pools clean; `keyExtractor` uses stable `block.id`. Horizontal carousels are nested FlashLists that virtualize independently and own the horizontal axis, while the master list owns the vertical axis — momentum is preserved by axis separation, with `nestedScrollEnabled` for Android.

## 5. Actions: one dispatcher, dumb components

Atomic components never contain business logic; they emit `handleAction(action)` and stay ignorant of what it does. The dispatcher is the single coordinator. The `Action` discriminated union + a `never` exhaustiveness check make it impossible to add an action type without handling it — a compile-time guarantee.

## 6. Overlay: normalized, non-blocking, cached

The server's `FULL_SCREEN_OVERLAY` node is normalized by `resolveOverlay()` into `{ kind, url }` (lottie vs image inferred from the URL or an explicit `media` hint). `pointerEvents="none"` keeps the UI fully interactive underneath; a failed asset fetch drops the overlay silently. Remote media is `memory-disk` cached via `expo-image`.

## What I'd add next (production hardening)

- **Schema versioning**: honor `payload.version` to support backward-compatible migrations of block shapes.
- **Lazy registry**: `React.lazy` per block type so rarely-used campaign blocks aren't in the initial bundle.
- **Telemetry**: emit a metric whenever the parser drops a block or the error boundary fires, so backend regressions surface in dashboards.
- **Real navigation/linking** in the dispatcher (currently mocked with `Alert`).
- **Bundled fallback Lottie** so a dead remote URL degrades to a local animation rather than nothing.
- **Detox/RNTL** rendering tests on top of the current logic unit tests.
