import { ComponentType } from 'react';
import { Block } from '../types/schema';
import BannerHero from '../components/blocks/BannerHero';
import ProductGrid2x2 from '../components/blocks/ProductGrid2x2';
import DynamicCollection from '../components/blocks/DynamicCollection';
import EventBooking from '../components/blocks/EventBooking';

/** Every block component receives the same prop shape. */
export interface BlockProps<D = unknown> {
  data: D;
  id: string;
}

/**
 * Hash-map factory: maps block type strings → React components.
 * No switch, no if/else. Adding a new block type = one line here,
 * zero changes anywhere else in the rendering engine.
 */
const REGISTRY: Record<string, ComponentType<BlockProps<any>>> = {
  BANNER_HERO: BannerHero,
  PRODUCT_GRID_2X2: ProductGrid2x2,
  DYNAMIC_COLLECTION: DynamicCollection,
  EVENT_BOOKING: EventBooking,
};

/**
 * Returns the component for a given block type, or null if unknown.
 * Unknown types are silently dropped — the rest of the tree survives.
 */
export function resolveBlock(
  type: string
): ComponentType<BlockProps<any>> | null {
  return REGISTRY[type] ?? null;
}
