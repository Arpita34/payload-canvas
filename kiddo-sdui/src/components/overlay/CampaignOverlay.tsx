import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { CampaignOverlayConfig } from '../../types/schema';

interface CampaignOverlayProps {
  config: CampaignOverlayConfig;
}

/**
 * CampaignOverlay — full-screen decorative overlay.
 *
 * CRITICAL: pointerEvents="none"
 * The confetti / splash animation plays over the whole screen but
 * every tap and scroll gesture passes THROUGH to the real UI underneath.
 * Without this, the overlay would block all user input — instant fail.
 *
 * Uses:
 * - LottieView for JSON animations (Back to School, Mystery Gift)
 * - expo-image for WebP overlays (Summer Playhouse) — disk-cached
 */
function CampaignOverlayBase({ config }: CampaignOverlayProps) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {config.type === 'LOTTIE' ? (
        <LottieView
          source={{ uri: config.url }}
          autoPlay
          loop
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        // WebP overlay — expo-image with disk+memory cache (efficient cache pipeline)
        <Image
          source={{ uri: config.url }}
          style={[StyleSheet.absoluteFill, styles.webpOverlay]}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}
    </View>
  );
}

export default memo(CampaignOverlayBase);

const styles = StyleSheet.create({
  webpOverlay: {
    opacity: 0.18, // subtle background wash for WebP overlays
  },
});
