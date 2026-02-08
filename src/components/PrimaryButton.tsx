import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export const PrimaryButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({ label, onPress, disabled }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F47C3C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    backgroundColor: '#C8B7AC'
  },
  label: {
    color: '#1F120B',
    fontWeight: '700'
  }
});
