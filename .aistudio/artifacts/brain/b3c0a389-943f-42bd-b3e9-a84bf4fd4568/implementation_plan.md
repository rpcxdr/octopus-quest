# Implementation Plan: Shared Generic Bitmap Caching Architecture

## Problem Summary & Goal
The game's render loop (60 FPS) incurs significant CPU overhead from procedurally evaluating and rasterizing 15–20 complex vector geometries every frame on the sea floor (microchips, qubits, glyph grids, ammonite candies, basalt fissures, starfish, shells, and crystals). This overhead doubles during reef biome transitions when the entire seabed layer cross-fades with alpha blending.

The user requested a clean, modular software design refactoring so that **all bitmap caching** in the application—including both **fish badge icons** and **seabed floor items**—uses a single, shared, generic utility.

---

## 1. Unified Architecture: Generic Bitmap Cache Engine (`src/utils/bitmapCache.ts`)

A centralized, type-safe bitmap cache utility will manage offscreen canvas creation, resolution scaling, lifecycle eviction, direct canvas blitting (`drawImage`), and data URL generation for DOM `<img>` elements.

```
                      ┌────────────────────────────────────────────────────────┐
                      │              Generic BitmapCache Engine                │
                      │               (src/utils/bitmapCache.ts)               │
                      └───────────────────────────┬────────────────────────────┘
                                                  │
                                ┌─────────────────┴─────────────────┐
                                ▼                                   ▼
                   [Direct Canvas Blit]                    [DOM <img> DataURL]
                  getOrCreateCanvas(key, ...)            getOrCreateDataUrl(key, ...)
                                │                                   │
              ┌─────────────────┴─────────────────┐                 │
              ▼                                   ▼                 ▼
     [Fish Badge Canvas]                [Seabed Floor Items]   [FishBadgeIcon]
   (fishBadgeRenderer.ts)                (seabedItems.ts)    (React Icon img)
```

### Core Design of `BitmapCache`
- **Class / Singleton Pattern**: `BitmapCache` with a default singleton instance `bitmapCache`.
- **Dual Representation**:
  - `canvas`: `HTMLCanvasElement` maintained in memory for instantaneous 60 FPS `ctx.drawImage` blits without serialization overhead.
  - `dataUrl`: Lazily generated `string` (via `canvas.toDataURL('image/png')`) computed only on first request for React components needing an image `src`.
- **API Surface**:
  - `getCanvas(key: string, width: number, height: number, render: RenderFn, options?: BitmapOptions): HTMLCanvasElement | null`
  - `getDataUrl(key: string, width: number, height: number, render: RenderFn, options?: BitmapOptions): string`
  - `drawCached(targetCtx: CanvasRenderingContext2D, key: string, dx: number, dy: number, width: number, height: number, render: RenderFn, options?: DrawOptions): boolean`
  - `clear(prefix?: string): void` (allows clearing specific namespaces, e.g., on biome change or memory pressure)
  - `prune(maxEntries?: number): void` (LRU tracking to ensure bounded memory usage)

---

## 2. Refactoring Existing Fish Badge Caching

Currently, `src/utils/fishBadgeRenderer.ts` contains its own ad-hoc `dataUrlCache = new Map<string, string>()` and runs manual `document.createElement('canvas')` logic.

### Refactoring Steps:
1. Remove the standalone `dataUrlCache` and duplicate offscreen canvas allocation in `fishBadgeRenderer.ts`.
2. Refactor `getFishBadgeDataUrl(fishType, customSkin)` to delegate to `bitmapCache.getDataUrl(...)`:
   - Cache key format: `fish_badge_${fishType}_${skinId}`.
   - Fixed raster size: `64x64`.
   - Render callback: calls the vector drawing function once to paint the fish badge at the center.
3. Refactor `drawFishBadgeCanvas(targetCtx, fishType, centerX, centerY, targetSize, customSkin)`:
   - Instead of re-evaluating vector geometry on every call, leverage `bitmapCache.drawCached(...)` to directly blit the pre-rendered fish canvas.

---

## 3. Implementing Seabed Item Caching via the Shared Utility

Seabed items in `src/utils/seabedItems.ts` are procedurally drawn multiple times across horizontal repeating intervals for all 7 themes (`original_kelp`, `blockWorld`, `candy`, `tangled_kelp`, `cyberGrid`, `lava`, `sunken_atlantis`).

### Refactoring Steps:
1. **Define Item Metadata & Bounding Boxes**:
   - Establish bounding box dimensions (`width`, `height`, `anchorX`, `anchorY`) for each item in each theme (e.g. `cyber_microchip: 36x24`, `cyber_hex_node: 32x28`, `cyber_qubit: 40x26`, `candy_swirl: 34x34`, `lava_fissure: 48x28`, `starfish: 36x36`).
2. **Standardize Render Callbacks**:
   - Each item's vector path logic is wrapped into a standardized drawing callback `(ctx, w, h) => void`.
   - The drawing logic renders the item centered within the offscreen canvas with its contact shadow and highlights.
3. **Cache Key Structure**:
   - Cache key format: `seabed_${theme}_${aestheticId}_${itemType}`.
   - Since themes and water aesthetics determine colors, items are cached per aesthetic and reused across all subsequent frames.
4. **Refactor `drawThemedSeabedDecorations` in `src/utils/seabedItems.ts`**:
   - Replace direct inline vector calls with `bitmapCache.drawCached(...)` using calculated screen positions.
   - For Cyber Grid flat perspective, the skew and scale transforms are applied cleanly during blitting or baked directly into the offscreen sprite canvas.
5. **Cross-Fade Optimization in `renderer.ts`**:
   - During biome transitions (`drawGround`), `drawImage` blits with `ctx.globalAlpha` cross-fade between outgoing and incoming themes with virtually zero CPU path overhead.

---

## 4. Software Design Benefits
- **Single Source of Truth**: One centralized cache manager handles memory, canvas pooling, high-DPI scaling, and fallbacks.
- **Zero Duplication**: No separate caching logic in fish icons versus seabed decorations.
- **Massive Performance Gain**: Eliminates hundreds of `ctx.save()`, `ctx.restore()`, gradient instantiations, and trigonometric calculations per frame.
- **Graceful SSR/Headless Fallback**: Safe checks for `typeof document === 'undefined'`.

---

## 5. Verification Plan
- **Unit & Lint Validation**: Run `lint_applet` and `compile_applet` to ensure zero type errors or broken imports.
- **Visual Parity**: Verify that fish badges in the fish selector panel, top stats, and modal dialogs look identical to before.
- **Seabed Visual Parity**: Verify all 7 seabed themes (Original Kelp, BlockWorld, Candy, Tangled Kelp, Cyber Grid, Lava, Sunken Atlantis) render with exact color harmony, shadows, and perspective.
- **Frame Rate & Transition Test**: Confirm smooth 60 FPS rendering without lag spikes during reef clearing and biome cross-fades.
