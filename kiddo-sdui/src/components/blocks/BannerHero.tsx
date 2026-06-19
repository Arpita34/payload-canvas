import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, PressableStateCallbackType } from 'react-native';
import { Image } from 'expo-image';
import { BannerHeroBlock } from '../../types/schema';
import { BlockProps } from '../../registry/componentRegistry';
import { handleAction } from '../../actions/dispatcher';
import { useTheme } from '../../theme/ThemeContext';
import { useRenderCount, RenderBadge } from '../../dev/renderCount';

type BannerHeroData = BannerHeroBlock['data'];

function BannerHeroBase({ data, id }: BlockProps<BannerHeroData>) {
  const { primary, accent, text } = useTheme();
  const renders = useRenderCount(`BannerHero:${id}`);

  return (
    <Pressable
      onPress={() => handleAction(data.action)}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.container,
        { transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${data.title} banner. ${data.subtitle ?? ''}`}
    >
      {/* Background image via expo-image (disk + memory cached) */}
      <Image
        source={{ uri: data.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />

      {/* Gradient overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{data.title}</Text>
        {data.subtitle ? (
          <Text style={styles.subtitle}>{data.subtitle}</Text>
        ) : null}
        {data.ctaLabel ? (
          <View style={[styles.ctaBtn, { backgroundColor: primary }]}>
            <Text style={styles.ctaBtnText}>{data.ctaLabel} →</Text>
          </View>
        ) : null}
      </View>

      <RenderBadge count={renders} />
    </Pressable>
  );
}

export default memo(BannerHeroBase);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    // Simulates a gradient using a semi-transparent overlay
    // (LinearGradient requires expo-linear-gradient, kept simple here)
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  ctaBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  ctaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
