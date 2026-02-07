import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGame } from '../state/GameContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

export const MenuScreen: React.FC<NativeStackScreenProps<RootStackParamList, 'Menu'>> = ({ navigation }) => {
  const { state } = useGame();

  const handleStart = () => {
    if (state.introComplete) {
      navigation.replace('Game');
    } else {
      navigation.replace('Intro');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sushi Catch Tycoon</Text>
      <Text style={styles.subtitle}>MVP Prototype</Text>
      <PrimaryButton label="Start Game" onPress={handleStart} />
      <Text style={styles.note}>iOS only • Offline MVP • Placeholder assets</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3A2416'
  },
  subtitle: {
    fontSize: 16,
    color: '#7A5A44',
    marginBottom: 24
  },
  note: {
    marginTop: 16,
    color: '#8A6D5C',
    fontSize: 12
  }
});
