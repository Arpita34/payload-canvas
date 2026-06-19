import { Alert } from 'react-native';
import { Action } from '../types/schema';
import { useCartStore } from '../store/cartStore';

/**
 * Universal action dispatcher.
 *
 * This is the ONLY place that knows about action business logic.
 * All atomic components (ProductCard, BannerHero, CTAButton) call
 * handleAction(action) and contain ZERO business logic themselves.
 *
 * A switch HERE is correct — this is logic dispatch, not rendering dispatch.
 */
export function handleAction(action: Action): void {
  switch (action.type) {
    case 'ADD_TO_CART':
      useCartStore.getState().addItem(action.payload.id);
      break;

    case 'DEEP_LINK':
      // In a real app: Linking.openURL or navigation.navigate(...)
      console.log('[Action] Navigate →', action.payload.url);
      Alert.alert('Navigate', `Opening: ${action.payload.url}`, [{ text: 'OK' }]);
      break;

    case 'APPLY_MYSTERY_GIFT_COUPON':
      console.log('[Action] Coupon applied →', action.payload.code);
      Alert.alert('🎁 Mystery Coupon!', `Code "${action.payload.code}" applied to your cart!`, [
        { text: 'Woohoo!' },
      ]);
      break;

    case 'OPEN_BOOKING':
      console.log('[Action] Booking →', action.payload.eventId);
      Alert.alert(
        '🎟 Book Experience',
        `Opening booking for: ${action.payload.eventId}`,
        [{ text: 'Confirm' }]
      );
      break;

    default: {
      // TypeScript exhaustiveness check: if a new Action type is added
      // to the discriminated union without handling it here, TS errors.
      const _exhaustiveCheck: never = action;
      if (__DEV__) {
        console.warn('[Action] Unhandled action type:', _exhaustiveCheck);
      }
      break;
    }
  }
}
