import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Block } from '../types/schema';
import { resolveBlock } from '../registry/componentRegistry';
import { BlockErrorBoundary } from '../components/BlockErrorBoundary';
import { useTheme } from '../theme/ThemeContext';
import { useCartStore } from '../store/cartStore';
import {
  useCampaignStore,
  CampaignKey,
  CAMPAIGN_LABELS,
} from '../store/campaignStore';

const CAMPAIGN_KEYS: CampaignKey[] = ['none', 'backToSchool', 'summerPlayhouse', 'mysteryGift'];

export default function HomeScreen() {
  const { primary, background, text, accent } = useTheme();
  const payload = useCampaignStore((s) => s.payload);
  const activeCampaign = useCampaignStore((s) => s.activeCampaign);
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);
  // Narrow selector — re-renders ONLY when count changes
  const cartCount = useCartStore((s) => s.count);

  /**
   * Block renderer — the rendering engine.
   * NEVER names a specific block type in an if/switch.
   * The registry decides what to render; this function only manages
   * unknown-block drops and error boundary wrapping.
   */
  const renderBlock = useCallback(
    ({ item }: ListRenderItemInfo<Block>) => {
      const Component = resolveBlock(item.type);
      if (!Component) {
        // Unknown block type: silently dropped. DEV warning only.
        if (__DEV__) {
          console.warn(`[SDUI] Unknown block type dropped: ${item.type} (id=${item.id})`);
        }
        return null;
      }
      return (
        <BlockErrorBoundary blockId={item.id}>
          <Component id={item.id} data={item.data} />
        </BlockErrorBoundary>
      );
    },
    []
  );

  // Stable key extractor — uses block.id, NEVER array index
  const keyExtractor = useCallback((b: Block) => b.id, []);

  // Tells FlashList which views can be recycled together (perf win)
  const getItemType = useCallback((b: Block) => b.type, []);

  const ListHeaderComponent = (
    <View style={[styles.header, { backgroundColor: primary }]}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerBrand}>kiddo</Text>
          <Text style={styles.headerTagline}>For little ones 💛</Text>
        </View>
        <Pressable style={[styles.cartBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: accent }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Dev Campaign Switcher */}
      <View style={styles.campaignSwitcher}>
        <Text style={styles.campaignSwitcherLabel}>Campaign:</Text>
        <View style={styles.campaignBtnRow}>
          {CAMPAIGN_KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setActiveCampaign(key)}
              style={[
                styles.campaignBtn,
                activeCampaign === key && styles.campaignBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.campaignBtnText,
                  activeCampaign === key && styles.campaignBtnTextActive,
                ]}
                numberOfLines={1}
              >
                {CAMPAIGN_LABELS[key]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={primary} />
      <View style={[styles.container, { backgroundColor: background }]}>
        {/**
         * THE SINGLE VERTICAL FLASHLIST.
         * The entire screen is rendered by this one list — no ScrollView wrapping.
         * FlashList recycles views via getItemType → high frame rate during scroll.
         * keyExtractor uses block.id → stable recycling, no index bugs.
         */}
        <FlashList
          data={payload.blocks}
          renderItem={renderBlock}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          ListHeaderComponent={ListHeaderComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerTagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartIcon: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  campaignSwitcher: {
    gap: 8,
  },
  campaignSwitcherLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  campaignBtnRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  campaignBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  campaignBtnActive: {
    backgroundColor: '#fff',
  },
  campaignBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  campaignBtnTextActive: {
    color: '#1A1A1A',
  },
});
