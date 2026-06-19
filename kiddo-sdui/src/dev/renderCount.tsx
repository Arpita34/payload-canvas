import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * DEV-ONLY render instrumentation for the "render isolation" proof.
 *
 * useRenderCount increments a ref every time the component renders and logs it.
 * <RenderBadge> draws a tiny "↻N" tag in the corner of a block/card.
 *
 * The proof: tap "Add to Cart" on one product → only that ProductCard's badge
 * and the header cart counter increment. Every block badge stays frozen,
 * demonstrating React.memo + narrow Zustand selectors isolate the re-render.
 *
 * All of this is gated on __DEV__ → it disappears completely in production builds.
 */
export function useRenderCount(label: string): number {
  const count = useRef(0);
  count.current += 1;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`🔁 [render] ${label} → ${count.current}`);
  }
  return count.current;
}

export function RenderBadge({ count }: { count: number }) {
  if (!__DEV__) return null;
  return (
    <View pointerEvents="none" style={styles.badge}>
      <Text style={styles.text}>↻{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 999,
  },
  text: {
    color: '#7CFC00',
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
