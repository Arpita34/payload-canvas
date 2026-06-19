import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface State {
  failed: boolean;
}

interface Props {
  children: React.ReactNode;
  blockId?: string;
}

/**
 * Per-block error boundary.
 * A malformed known block (e.g. products: null) renders as blank slot.
 * The rest of the screen tree is completely unaffected.
 */
export class BlockErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.warn(
        `[SDUI] Block error boundary caught (id=${this.props.blockId ?? 'unknown'}):`,
        error.message,
        info.componentStack
      );
    }
  }

  render() {
    if (this.state.failed) {
      // In __DEV__ show a faint placeholder so developers can spot it.
      if (__DEV__) {
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              ⚠ Block failed to render (id: {this.props.blockId ?? '?'})
            </Text>
          </View>
        );
      }
      return null; // Production: blank slot, invisible to users.
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  placeholder: {
    margin: 8,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#856404',
    fontSize: 12,
    fontFamily: 'System',
  },
});
