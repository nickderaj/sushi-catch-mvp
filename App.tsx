import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GameProvider } from './src/state/GameContext';
import { MenuScreen } from './src/screens/MenuScreen';
import { IntroScreen } from './src/screens/IntroScreen';
import { HatchScreen } from './src/screens/HatchScreen';
import { FishScreen } from './src/screens/FishScreen';
import { RestaurantScreen } from './src/screens/RestaurantScreen';
import { PetsScreen } from './src/screens/PetsScreen';
import { PetDetailScreen } from './src/screens/PetDetailScreen';
import { DebugScreen } from './src/screens/DebugScreen';
import type { RootStackParamList, GameTabParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<GameTabParamList>();

const GameTabs = () => (
  <Tabs.Navigator screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="Hatch" component={HatchScreen} />
    <Tabs.Screen name="Fish" component={FishScreen} />
    <Tabs.Screen name="Restaurant" component={RestaurantScreen} />
    <Tabs.Screen name="Pets" component={PetsScreen} />
    <Tabs.Screen name="Debug" component={DebugScreen} />
  </Tabs.Navigator>
);

export default function App() {
  return (
    <GameProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Menu" component={MenuScreen} />
              <Stack.Screen name="Intro" component={IntroScreen} />
              <Stack.Screen name="Game" component={GameTabs} />
              <Stack.Screen name="PetDetail" component={PetDetailScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </GameProvider>
  );
}
