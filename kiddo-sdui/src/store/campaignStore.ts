import { create } from 'zustand';
import { HomePayload } from '../types/schema';

import homepageData from '../data/homepage.json';
import backToSchoolData from '../data/campaign-backToSchool.json';
import summerPlayhouseData from '../data/campaign-summerPlayhouse.json';
import mysteryGiftData from '../data/campaign-mysteryGift.json';

export type CampaignKey = 'none' | 'backToSchool' | 'summerPlayhouse' | 'mysteryGift';

export const CAMPAIGN_PAYLOADS: Record<CampaignKey, HomePayload> = {
  none: homepageData as HomePayload,
  backToSchool: backToSchoolData as HomePayload,
  summerPlayhouse: summerPlayhouseData as HomePayload,
  mysteryGift: mysteryGiftData as HomePayload,
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
