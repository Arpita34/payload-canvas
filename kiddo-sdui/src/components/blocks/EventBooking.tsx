import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { EventBookingBlock, BookingEvent } from '../../types/schema';
import { BlockProps } from '../../registry/componentRegistry';
import { handleAction } from '../../actions/dispatcher';
import { useTheme } from '../../theme/ThemeContext';
import { useRenderCount, RenderBadge } from '../../dev/renderCount';

type EventBookingData = EventBookingBlock['data'];

/**
 * EventBooking — specialty horizontal row of bookable experiences
 * (e.g. 'Petting Zoo Tickets', 'Splash Park Entry').
 *
 * Unlike a ProductCard, a booking card fires OPEN_BOOKING (not ADD_TO_CART)
 * and presents a ticket-style "Book" CTA. It is a separate registry entry,
 * demonstrating that new block types plug in with zero changes to the engine.
 *
 * Perf: nested horizontal FlashList, stable renderItem/keyExtractor,
 * nestedScrollEnabled so Android keeps vertical momentum on the master list.
 */
function BookingCard({ event }: { event: BookingEvent }) {
  const { primary, text, cardBg, accent, subtitleText } = useTheme();
  const renders = useRenderCount(`BookingCard:${event.id}`);

  return (
    <Pressable
      onPress={() => handleAction(event.action)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardBg ?? '#FFFFFF', shadowColor: primary, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Book ${event.name}, ₹${event.price}`}
    >
      <RenderBadge count={renders} />
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: event.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Text style={styles.badgeText}>🎟 {event.badge ?? 'Book'}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: text }]} numberOfLines={2}>
          {event.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: primary }]}>₹{event.price}</Text>
          {event.mrp && event.mrp > event.price ? (
            <Text style={[styles.mrp, { color: subtitleText ?? '#999' }]}>₹{event.mrp}</Text>
          ) : null}
        </View>
        <View style={[styles.bookBtn, { backgroundColor: primary }]}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </View>
      </View>
    </Pressable>
  );
}

const MemoBookingCard = memo(BookingCard);

function EventBookingBase({ data, id }: BlockProps<EventBookingData>) {
  const { text } = useTheme();
  const renders = useRenderCount(`EventBooking:${id}`);

  // Resilience: guard against null / non-array events
  const events: BookingEvent[] = Array.isArray(data?.events) ? data.events : [];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BookingEvent>) => <MemoBookingCard event={item} />,
    []
  );
  const keyExtractor = useCallback((e: BookingEvent) => e.id, []);

  return (
    <View style={styles.container}>
      <RenderBadge count={renders} />
      <Text style={[styles.sectionTitle, { color: text }]}>{data?.title ?? ''}</Text>
      <FlashList
        horizontal
        data={events}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

export default memo(EventBookingBase);

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
  card: {
    width: 160,
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    margin: 6,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: {
    width: '100%',
    height: 110,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: 10,
    gap: 4,
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    minHeight: 36,
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
  bookBtn: {
    marginTop: 'auto',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
