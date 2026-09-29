/**
 * Shared Generic Bitmap Caching Engine
 *
 * Centralizes offscreen rasterization, resolution handling, lifecycle management,
 * and high-performance blitting across the application.
 *
 * Used by:
 * - Fish badge icon rendering (fishBadgeRenderer.ts & FishBadgeIcon.tsx)
 * - Seabed themed decorations (seabedItems.ts)
 */

export type RenderCallback = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => void;

export interface BitmapCacheEntry {
  canvas: HTMLCanvasElement;
  dataUrl?: string;
  width: number;
  height: number;
  lastUsed: number;
}

export interface DrawCachedOptions {
  /** Horizontal anchor point (0: left, 0.5: center, 1: right). Default: 0.5 */
  anchorX?: number;
  /** Vertical anchor point (0: top, 0.5: middle, 1: bottom). Default: 0.5 */
  anchorY?: number;
  /** Optional alpha multiplier for drawing. Default: 1.0 */
  alpha?: number;
}

export class BitmapCache {
  private cache: Map<string, BitmapCacheEntry> = new Map();
  private maxEntries: number;

  constructor(maxEntries: number = 320) {
    this.maxEntries = maxEntries;
  }

  /**
   * Retrieves or creates an offscreen canvas containing the pre-rendered artwork.
   */
  public getCanvas(
    key: string,
    width: number,
    height: number,
    render: RenderCallback
  ): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;

    const existing = this.cache.get(key);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.canvas;
    }

    if (this.cache.size >= this.maxEntries) {
      this.prune(Math.floor(this.maxEntries * 0.75));
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
      render(ctx, canvas.width, canvas.height);
    } catch {
      // In case of any render issue, leave canvas blank
    }

    const entry: BitmapCacheEntry = {
      canvas,
      width: canvas.width,
      height: canvas.height,
      lastUsed: Date.now(),
    };

    this.cache.set(key, entry);
    return canvas;
  }

  /**
   * Retrieves or lazily creates a PNG data URL for DOM <img> elements.
   */
  public getDataUrl(
    key: string,
    width: number,
    height: number,
    render: RenderCallback
  ): string {
    if (typeof document === 'undefined') return '';

    const existing = this.cache.get(key);
    if (existing) {
      existing.lastUsed = Date.now();
      if (!existing.dataUrl) {
        existing.dataUrl = existing.canvas.toDataURL('image/png');
      }
      return existing.dataUrl;
    }

    const canvas = this.getCanvas(key, width, height, render);
    if (!canvas) return '';

    const entry = this.cache.get(key);
    if (entry) {
      entry.dataUrl = canvas.toDataURL('image/png');
      return entry.dataUrl;
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Directly blits the cached bitmap onto a target canvas context.
   * Eliminates hundreds of vector path and gradient evaluations in 60 FPS loops.
   */
  public drawCached(
    targetCtx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    width: number,
    height: number,
    render: RenderCallback,
    options?: DrawCachedOptions
  ): boolean {
    const canvas = this.getCanvas(key, width, height, render);
    if (!canvas) return false;

    const anchorX = options?.anchorX ?? 0.5;
    const anchorY = options?.anchorY ?? 0.5;
    const dx = x - width * anchorX;
    const dy = y - height * anchorY;

    if (options?.alpha !== undefined && options.alpha < 0.999) {
      targetCtx.save();
      targetCtx.globalAlpha *= Math.max(0, Math.min(1, options.alpha));
      targetCtx.drawImage(canvas, dx, dy);
      targetCtx.restore();
    } else {
      targetCtx.drawImage(canvas, dx, dy);
    }

    return true;
  }

  /**
   * Checks if an entry currently exists in cache.
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clears all cached bitmaps, or only those matching a key prefix.
   */
  public clear(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }

    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Prunes oldest used entries to prevent unbounded memory growth.
   */
  public prune(targetCount: number = 200): void {
    if (this.cache.size <= targetCount) return;

    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastUsed - b[1].lastUsed
    );

    const toRemove = this.cache.size - targetCount;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Total number of cached bitmaps.
   */
  public size(): number {
    return this.cache.size;
  }
}

/**
 * Shared singleton instance used across the entire application.
 */
export const bitmapCache = new BitmapCache();
