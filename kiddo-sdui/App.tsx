import React from 'react';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useCampaignStore } from './src/store/campaignStore';
import HomeScreen from './src/screens/HomeScreen';
import CampaignOverlay from './src/components/overlay/CampaignOverlay';

/**
 * Root Application
 *
 * Provider order (outermost → innermost):
 * 1. ThemeProvider — derives theme from the active campaign payload
 * 2. HomeScreen   — the single-screen SDUI renderer
 * 3. CampaignOverlay — rendered on top with pointerEvents="none"
 *
 * This component re-renders when activeCampaign changes, but that
 * only affects ThemeProvider value and overlay config.
 * All heavy block rendering is inside HomeScreen which reads its own
 * Zustand slices independently.
 */
function AppInner() {
  const payload = useCampaignStore((s) => s.payload);

  return (
    <ThemeProvider value={payload.theme}>
      <HomeScreen />
      {payload.campaignOverlay && (
        <CampaignOverlay config={payload.campaignOverlay} />
      )}
    </ThemeProvider>
  );
}

export default function App() {
  return <AppInner />;
}
