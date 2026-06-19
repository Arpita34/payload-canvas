import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { CampaignOverlayConfig, resolveOverlay } from '../../types/schema';

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
 * RESILIENCE:
 * - Accepts the canonical { type: 'FULL_SCREEN_OVERLAY', animation_url } node
 *   as well as legacy { type: 'LOTTIE' | 'WEBP', url } forms — normalized via resolveOverlay.
 * - A malformed config, or a remote asset that fails to load (dead URL / network),
 *   silently renders nothing. The overlay is decorative — it must never break the app.
 *
 * Uses:
 * - LottieView for JSON animations (Back to School, Mystery Gift)
 * - expo-image for WebP/image overlays (Summer Playhouse) — disk + memory cached
 */
function CampaignOverlayBase({ config }: CampaignOverlayProps) {
  const [failed, setFailed] = useState(false);

  const overlay = resolveOverlay(config);
  if (!overlay || failed) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {overlay.kind === 'lottie' ? (
        <LottieView
          source={{ uri: overlay.url }}
          autoPlay
          loop
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          // If the remote Lottie can't be parsed, drop quietly instead of crashing.
          onAnimationFailure={() => setFailed(true)}
        />
      ) : (
        // Image/WebP overlay — expo-image with disk+memory cache (efficient cache pipeline)
        <Image
          source={{ uri: overlay.url }}
          style={[StyleSheet.absoluteFill, styles.webpOverlay]}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

export default memo(CampaignOverlayBase);

const styles = StyleSheet.create({
  webpOverlay: {
    opacity: 0.18, // subtle background wash for image overlays
  },
});
