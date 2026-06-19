import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { DynamicCollBlock, Product } from '../../types/schema';
import { BlockProps } from '../../registry/componentRegistry';
import { useTheme } from '../../theme/ThemeContext';
import { useRenderCount, RenderBadge } from '../../dev/renderCount';
import ProductCard from '../atoms/ProductCard';

type DynamicCollData = DynamicCollBlock['data'];

/**
 * DynamicCollection — nested horizontal list inside the vertical master list.
 *
 * Performance design:
 * - renderItem and keyExtractor are useCallback-stable → no re-creation per parent render.
 * - Horizontal FlashList virtualizes independently → memory stays flat.
 * - The outer vertical list owns vertical gestures; the inner horizontal owns horizontal.
 *   RN's gesture system separates them by axis, so vertical momentum is preserved.
 */
function DynamicCollectionBase({ data, id }: BlockProps<DynamicCollData>) {
  const { text } = useTheme();
  const renders = useRenderCount(`DynamicCollection:${id}`);

  // Resilience: guard against null/non-array products
  const products: Product[] = Array.isArray(data?.products) ? data.products : [];

  // useCallback-stable — not re-created on every parent render
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => (
      <ProductCard product={item} size="small" />
    ),
    []
  );

  const keyExtractor = useCallback((p: Product) => p.id, []);

  return (
    <View style={styles.container}>
      <RenderBadge count={renders} />
      <Text style={[styles.sectionTitle, { color: text }]}>{data?.title ?? ''}</Text>
      <FlashList
        horizontal
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        // FlashList recycles views per item → memory stays flat during heavy horizontal scrolling
      />
    </View>
  );
}

export default memo(DynamicCollectionBase);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 16,
    letterSpacing: -0.3,
  },
  listContent: {
    paddingHorizontal: 10,
  },
});
