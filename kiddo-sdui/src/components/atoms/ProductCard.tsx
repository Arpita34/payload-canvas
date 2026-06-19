import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PressableStateCallbackType,
} from 'react-native';
import { Image } from 'expo-image';
import { Product } from '../../types/schema';
import { handleAction } from '../../actions/dispatcher';
import { useCartStore } from '../../store/cartStore';
import { useTheme } from '../../theme/ThemeContext';
import { useRenderCount, RenderBadge } from '../../dev/renderCount';

interface ProductCardProps {
  product: Product;
  size?: 'small' | 'medium';
}

/**
 * ProductCard — RENDER ISOLATION BOUNDARY.
 *
 * This component subscribes ONLY to its own quantity slice:
 *   useCartStore((s) => s.items[product.id] ?? 0)
 *
 * When another product's cart quantity changes, Zustand does NOT
 * re-render this card because the selected value hasn't changed.
 * Combined with React.memo, this card ONLY re-renders when:
 *   1. Its own quantity changes (from the cart)
 *   2. The theme changes (campaign switch)
 *   3. Its product prop reference changes
 *
 * This is the "render mandate" proof: 30+ blocks remain frozen
 * while only the tapped card + header badge update.
 */
function ProductCardBase({ product, size = 'medium' }: ProductCardProps) {
  // Narrow selector — isolated per product ID
  const qty = useCartStore((s) => s.items[product.id] ?? 0);
  const { primary, text, cardBg, subtitleText } = useTheme();
  const renders = useRenderCount(`ProductCard:${product.id}`);

  const isSmall = size === 'small';
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

  return (
    <Pressable
      onPress={() => handleAction(product.action)}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.card,
        isSmall && styles.cardSmall,
        {
          backgroundColor: cardBg ?? '#FFFFFF',
          shadowColor: primary,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ₹${product.price}. Tap to add to cart.`}
    >
      <RenderBadge count={renders} />

      {/* Product image */}
      <View style={[styles.imageContainer, isSmall && styles.imageContainerSmall]}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        {/* Quantity badge */}
        {qty > 0 && (
          <View style={[styles.qtyBadge, { backgroundColor: primary }]}>
            <Text style={styles.qtyText}>{qty}</Text>
          </View>
        )}
        {/* Discount badge or product badge */}
        {product.badge ? (
          <View style={[styles.discountBadge, { backgroundColor: primary }]}>
            <Text style={styles.discountText}>{product.badge}</Text>
          </View>
        ) : discount && discount > 0 ? (
          <View style={[styles.discountBadge, { backgroundColor: '#22C55E' }]}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        ) : null}
      </View>

      {/* Product info */}
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: text }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: primary }]}>₹{product.price}</Text>
          {product.mrp && product.mrp > product.price && (
            <Text style={[styles.mrp, { color: subtitleText ?? '#999' }]}>
              ₹{product.mrp}
            </Text>
          )}
        </View>

        {/* Add / counter button */}
        {qty === 0 ? (
          <Pressable
            onPress={() => handleAction(product.action)}
            style={[styles.addBtn, { borderColor: primary }]}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
          >
            <Text style={[styles.addBtnText, { color: primary }]}>+ Add</Text>
          </Pressable>
        ) : (
          <View style={[styles.counterRow, { borderColor: primary }]}>
            <Pressable
              onPress={() => useCartStore.getState().removeItem(product.id)}
              style={[styles.counterBtn, { backgroundColor: primary }]}
              accessibilityRole="button"
              accessibilityLabel="Remove one from cart"
            >
              <Text style={styles.counterBtnText}>−</Text>
            </Pressable>
            <Text style={[styles.counterQty, { color: text }]}>{qty}</Text>
            <Pressable
              onPress={() => handleAction(product.action)}
              style={[styles.counterBtn, { backgroundColor: primary }]}
              accessibilityRole="button"
              accessibilityLabel="Add one more to cart"
            >
              <Text style={styles.counterBtnText}>+</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// React.memo: this card only re-renders when its specific props or
// its narrow Zustand slice changes. The isolation boundary.
export default memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    margin: 6,
  },
  cardSmall: {
    width: 140,
    height: 248, // fixed uniform height → horizontal FlashList can't clip the Add button
    flexShrink: 0,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  imageContainerSmall: {
    height: 110,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  qtyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    minHeight: 36, // reserve 2 lines → Add button sits at a consistent position
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
  },
  mrp: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  counterRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  counterBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  counterQty: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
});
