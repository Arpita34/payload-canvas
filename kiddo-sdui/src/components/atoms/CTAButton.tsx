import React, { memo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  PressableStateCallbackType,
} from 'react-native';
import { Action } from '../../types/schema';
import { handleAction } from '../../actions/dispatcher';
import { useTheme } from '../../theme/ThemeContext';

interface CTAButtonProps {
  label: string;
  action: Action;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  fullWidth?: boolean;
}

function CTAButtonBase({
  label,
  action,
  variant = 'primary',
  loading = false,
  fullWidth = false,
}: CTAButtonProps) {
  const { primary, accent, text } = useTheme();

  const getStyle = (pressed: boolean) => {
    const base = [
      styles.button,
      fullWidth && styles.fullWidth,
      {
        backgroundColor:
          variant === 'primary'
            ? primary
            : variant === 'secondary'
            ? accent
            : 'transparent',
        borderColor: primary,
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      },
    ];
    return base;
  };

  return (
    <Pressable
      onPress={() => !loading && handleAction(action)}
      style={({ pressed }: PressableStateCallbackType) => getStyle(pressed)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? primary : '#fff'} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: variant === 'outline' ? primary : '#fff',
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export default memo(CTAButtonBase);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minWidth: 80,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
