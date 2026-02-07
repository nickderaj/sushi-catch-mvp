import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StatBlock } from '../utils/rng';

export const StatBlockView: React.FC<{ stats: StatBlock }> = ({ stats }) => {
  return (
    <View style={styles.container}>
      {Object.entries(stats).map(([key, value]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{key}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5EA',
    padding: 8,
    borderRadius: 10
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2
  },
  label: {
    color: '#5A3E2B',
    textTransform: 'capitalize'
  },
  value: {
    fontWeight: '600'
  }
});
