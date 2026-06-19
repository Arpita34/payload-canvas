import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductGridBlock, Product } from '../../types/schema';
import { BlockProps } from '../../registry/componentRegistry';
import { useTheme } from '../../theme/ThemeContext';
import { useRenderCount, RenderBadge } from '../../dev/renderCount';
import ProductCard from '../atoms/ProductCard';

type ProductGridData = ProductGridBlock['data'];

function ProductGrid2x2Base({ data, id }: BlockProps<ProductGridData>) {
  const { text } = useTheme();
  const renders = useRenderCount(`ProductGrid:${id}`);

  // Resilience: if products is null/undefined/not-array, render nothing safely
  const products: Product[] = Array.isArray(data?.products)
    ? data.products.slice(0, 4) // cap at 4 for 2×2 layout
    : [];

  return (
    <View style={styles.container}>
      <RenderBadge count={renders} />
      <Text style={[styles.sectionTitle, { color: text }]}>{data?.title ?? ''}</Text>
      <View style={styles.grid}>
        {products.map((product) => (
          <View key={product.id} style={styles.cell}>
            <ProductCard product={product} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default memo(ProductGrid2x2Base);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 6,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
  },
});
