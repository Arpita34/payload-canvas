import { create } from 'zustand';
import { HomePayload } from '../types/schema';
import { parseHomePayload } from '../engine/parsePayload';

import homepageData from '../data/homepage.json';
import backToSchoolData from '../data/campaign-backToSchool.json';
import summerPlayhouseData from '../data/campaign-summerPlayhouse.json';
import mysteryGiftData from '../data/campaign-mysteryGift.json';

export type CampaignKey = 'none' | 'backToSchool' | 'summerPlayhouse' | 'mysteryGift';

// Every raw JSON is run through the defensive parser at ingestion.
// No `as HomePayload` casts — corrupt/unknown data is normalized away here,
// before any of it can reach the rendering engine.
export const CAMPAIGN_PAYLOADS: Record<CampaignKey, HomePayload> = {
  none: parseHomePayload(homepageData),
  backToSchool: parseHomePayload(backToSchoolData),
  summerPlayhouse: parseHomePayload(summerPlayhouseData),
  mysteryGift: parseHomePayload(mysteryGiftData),
};

export const CAMPAIGN_LABELS: Record<CampaignKey, string> = {
  none: '🏠 Home',
  backToSchool: '✏️ Back to School',
  summerPlayhouse: '🌊 Summer',
  mysteryGift: '🎪 Mystery Gift',
};

interface CampaignState {
  activeCampaign: CampaignKey;
  payload: HomePayload;
  setActiveCampaign: (campaign: CampaignKey) => void;
}

export const useCampaignStore = create<CampaignState>((set) => ({
  activeCampaign: 'none',
  payload: CAMPAIGN_PAYLOADS.none,

  setActiveCampaign: (campaign) =>
    set({
      activeCampaign: campaign,
      payload: CAMPAIGN_PAYLOADS[campaign],
    }),
}));
