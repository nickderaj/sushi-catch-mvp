import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EGG_TYPES, LOCATIONS } from '../data/gameData';
import { randomFish, randomName, randomRole, randomSpeciesId, rollStats } from '../utils/rng';
import { clamp, now } from '../utils/time';
import type { Character, PlayerState, Trip, TripRewards } from './gameTypes';
import type { Rarity } from '../data/gameData';

const STORAGE_KEY = 'sushi-catch-mvp-state';

const createId = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const defaultState: PlayerState = {
  introComplete: false,
  coins: 250,
  shells: 50,
  eggsByRarity: {
    '1': 1,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0
  },
  fishCurrency: 0,
  ownedCharacters: [],
  trips: [],
  restaurantStaffIds: [],
  restaurant: {
    level: 1,
    coinsPerMin: 5,
    tipsPerTap: 2,
    customerRateSec: 45,
    comboMax: 5
  },
  lastActiveAt: now()
};

const COINS_PER_FISH = 2;

const getIdleRate = (state: PlayerState) => {
  const staff = state.ownedCharacters.filter((char) => state.restaurantStaffIds.includes(char.id));
  const charismaSum = staff.reduce((sum, char) => sum + char.stats.charisma, 0);
  const multiplier = 1 + charismaSum / 300;
  return Math.max(1, Math.round(state.restaurant.coinsPerMin * multiplier));
};

const getIdleCapMinutes = (state: PlayerState) => {
  const staff = state.ownedCharacters.filter((char) => state.restaurantStaffIds.includes(char.id));
  const staminaSum = staff.reduce((sum, char) => sum + char.stats.stamina, 0);
  return 8 * 60 + Math.floor(staminaSum / 2);
};

const computeFishConsumedPerMin = (state: PlayerState) => {
  const staff = state.ownedCharacters.filter((char) => state.restaurantStaffIds.includes(char.id));
  const staminaSum = staff.reduce((sum, char) => sum + char.stats.stamina, 0);
  return Math.max(1, Math.floor(staminaSum / 120));
};

const calculateIdleEarnings = (state: PlayerState) => {
  const elapsedMs = now() - state.lastActiveAt;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const capMin = getIdleCapMinutes(state);
  const effectiveMin = clamp(elapsedMin, 0, capMin);
  const rate = getIdleRate(state);
  const rawCoins = effectiveMin * rate;
  const maxCoinsFromFish = state.fishCurrency * COINS_PER_FISH;
  const coins = Math.min(rawCoins, maxCoinsFromFish);
  const fishUsed = Math.min(state.fishCurrency, Math.ceil(coins / COINS_PER_FISH));
  return { coins, fishUsed };
};

const rollCharacter = (rarity: Rarity): Character => {
  const speciesId = randomSpeciesId();
  return {
    id: createId(),
    name: randomName(),
    rarity,
    role: randomRole(),
    speciesId,
    level: 1,
    stats: rollStats(speciesId, rarity),
    createdAt: now()
  };
};

const fishValueForRarity = (rarity: TripRewards['fish'][number]['rarity']) => {
  switch (rarity) {
    case '5':
      return 120;
    case '4':
      return 90 + Math.floor(Math.random() * 20);
    case '3':
      return 60 + Math.floor(Math.random() * 20);
    case '2':
      return 40 + Math.floor(Math.random() * 20);
    default:
      return 20 + Math.floor(Math.random() * 20);
  }
};

const resolveTripRewards = (crew: Character[], locationId: string): TripRewards => {
  if (crew.length === 0) {
    return {
      fish: [],
      fishCurrency: 0,
      coins: 0,
      xp: 0,
      shells: 0,
      treasure: false,
      score: 0,
      outcomeLabel: 'No crew assigned'
    };
  }
  const statTotal = crew.reduce((sum, char) => {
    const s = char.stats;
    return sum + s.power + s.dexterity + s.speed + s.luck + s.stamina + s.charisma;
  }, 0);
  const avgStat = statTotal / (crew.length * 6);
  const score = clamp(Math.round((avgStat / 70) * 100 + Math.random() * 10), 0, 100);

  let outcomeLabel = 'Common haul';
  let rarity: '1' | '2' | '3' | '4' | '5' = '1';
  if (score > 80) {
    outcomeLabel = 'Epic / Legendary haul';
    rarity = Math.random() < 0.2 ? '5' : '4';
  } else if (score >= 60) {
    outcomeLabel = 'Uncommon / Rare haul';
    rarity = Math.random() < 0.35 ? '3' : '2';
  } else if (score >= 40) {
    outcomeLabel = 'Common haul';
    rarity = '1';
  } else {
    outcomeLabel = 'Fish got away';
    rarity = '1';
  }

  const fishCount = score < 40 ? 0 : Math.max(1, Math.round(score / 30));
  const fish = Array.from({ length: fishCount }).map(() => {
    const fishName = randomFish();
    const value = fishValueForRarity(rarity);
    return {
      id: `${locationId}-${fishName}-${createId()}`,
      name: fishName,
      rarity,
      value
    };
  });

  const fishCurrency = fish.reduce((sum, item) => sum + item.value, 0);
  const treasure = Math.random() < 0.02;
  const shells = treasure ? 5 + Math.floor(Math.random() * 6) : 0;

  return {
    fish,
    fishCurrency,
    coins: score < 40 ? 5 : 20 + Math.round(score / 2),
    xp: score < 40 ? 5 : 15 + Math.round(score / 3),
    shells,
    treasure,
    score,
    outcomeLabel
  };
};

const GameContext = createContext<{
  state: PlayerState;
  loading: boolean;
  hatchEggs: (rarity: Rarity, count: number) => Character[];
  completeIntro: () => void;
  buyEggs: (rarity: Rarity, count: number) => void;
  startTrip: (crewIds: string[], locationId: string, durationSec: number) => void;
  claimTrip: (tripId: string) => TripRewards | null;
  collectIdle: () => void;
  setRestaurantStaff: (ids: string[]) => void;
  upgradeRestaurant: (type: 'throughput' | 'rate') => void;
  resetGame: () => void;
  addResources: (
    coins: number,
    shells: number,
    eggsByRarity: Partial<Record<Rarity, number>>,
    fishCurrency: number
  ) => void;
  skipTrips: () => void;
  getIdlePreview: () => { coins: number; fishUsed: number };
  getFishConsumedPerMin: () => number;
}>({
  state: defaultState,
  loading: true,
  hatchEggs: () => [],
  completeIntro: () => {},
  buyEggs: () => {},
  startTrip: () => {},
  claimTrip: () => null,
  collectIdle: () => {},
  setRestaurantStaff: () => {},
  upgradeRestaurant: () => {},
  resetGame: () => {},
  addResources: () => {},
  skipTrips: () => {},
  getIdlePreview: () => ({ coins: 0, fishUsed: 0 }),
  getFishConsumedPerMin: () => 0
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PlayerState>(defaultState);
  const [loading, setLoading] = useState(true);

  const saveState = useCallback(async (next: PlayerState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PlayerState & { pearls?: number; eggs?: number };
          const migratedCharacters = (parsed.ownedCharacters ?? []).map((char) => {
            const baseLevel = char.level ?? 1;
            if (!char.speciesId) {
              const speciesId = randomSpeciesId();
              return {
                ...char,
                level: baseLevel,
                speciesId,
                stats: rollStats(speciesId, char.rarity)
              };
            }
            const stats = { ...(char.stats as Record<string, number>) } as any;
            if ('expertise' in stats && !('stamina' in stats)) {
              stats.stamina = stats.expertise;
              delete stats.expertise;
            }
            return { ...char, level: baseLevel, stats };
          });
          const eggsByRarity: Record<Rarity, number> = {
            '1': parsed.eggsByRarity?.['1'] ?? parsed.eggs ?? 0,
            '2': parsed.eggsByRarity?.['2'] ?? 0,
            '3': parsed.eggsByRarity?.['3'] ?? 0,
            '4': parsed.eggsByRarity?.['4'] ?? 0,
            '5': parsed.eggsByRarity?.['5'] ?? 0
          };
          const shells = parsed.shells + (parsed.pearls ?? 0);
          const baseState: PlayerState = {
            ...defaultState,
            ...parsed,
            shells,
            eggsByRarity,
            fishCurrency: parsed.fishCurrency ?? 0,
            restaurantStaffIds: parsed.restaurantStaffIds ?? [],
            ownedCharacters: migratedCharacters
          };
          const idlePreview = calculateIdleEarnings(baseState);
          const next: PlayerState = {
            ...baseState,
            coins: baseState.coins + idlePreview.coins,
            fishCurrency: Math.max(0, baseState.fishCurrency - idlePreview.fishUsed),
            lastActiveAt: now()
          };
          setState(next);
        }
      } catch {
        setState(defaultState);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading) {
      saveState({ ...state, lastActiveAt: now() });
    }
  }, [state, loading, saveState]);

  const hatchEggs = useCallback(
    (rarity: Rarity, count: number) => {
      const available = state.eggsByRarity[rarity] ?? 0;
      const actual = Math.min(count, available);
      if (actual <= 0) return [] as Character[];
      const pulls = Array.from({ length: actual }).map(() => rollCharacter(rarity));
      setState((prev) => ({
        ...prev,
        eggsByRarity: {
          ...prev.eggsByRarity,
          [rarity]: Math.max(0, (prev.eggsByRarity[rarity] ?? 0) - actual)
        },
        ownedCharacters: [...pulls, ...prev.ownedCharacters]
      }));
      return pulls;
    },
    [state.eggsByRarity]
  );

  const completeIntro = useCallback(() => {
    setState((prev) => ({
      ...prev,
      introComplete: true
    }));
  }, []);

  const buyEggs = useCallback((rarity: Rarity, count: number) => {
    const config = EGG_TYPES.find((egg) => egg.rarity === rarity);
    if (!config) return;
    const cost = config.shellCost * count;
    setState((prev) => {
      if (prev.shells < cost) return prev;
      return {
        ...prev,
        shells: prev.shells - cost,
        eggsByRarity: {
          ...prev.eggsByRarity,
          [rarity]: (prev.eggsByRarity[rarity] ?? 0) + count
        }
      };
    });
  }, []);

  const startTrip = useCallback((crewIds: string[], locationId: string, durationSec: number) => {
    if (crewIds.length === 0) return;
    const locationExists = LOCATIONS.some((loc) => loc.id === locationId);
    if (!locationExists) return;
    const startedAt = now();
    const trip: Trip = {
      id: createId(),
      crewIds,
      locationId,
      durationSec,
      startedAt,
      endsAt: startedAt + durationSec * 1000,
      resolved: false
    };
    setState((prev) => ({
      ...prev,
      trips: [trip, ...prev.trips]
    }));
  }, []);

  const claimTrip = useCallback((tripId: string) => {
    let resolvedRewards: TripRewards | null = null;
    setState((prev) => {
      const trip = prev.trips.find((t) => t.id === tripId);
      if (!trip) return prev;
      if (trip.resolved) return prev;
      if (trip.endsAt > now()) return prev;
      const crew = prev.ownedCharacters.filter((c) => trip.crewIds.includes(c.id));
      const rewards = resolveTripRewards(crew, trip.locationId);
      resolvedRewards = rewards;
      const nextTrips = prev.trips.map((t) =>
        t.id === tripId ? { ...t, resolved: true, rewards } : t
      );
      return {
        ...prev,
        coins: prev.coins + rewards.coins,
        fishCurrency: prev.fishCurrency + rewards.fishCurrency,
        shells: prev.shells + rewards.shells,
        trips: nextTrips
      };
    });
    return resolvedRewards;
  }, []);

  const collectIdle = useCallback(() => {
    setState((prev) => {
      const idlePreview = calculateIdleEarnings(prev);
      return {
        ...prev,
        coins: prev.coins + idlePreview.coins,
        fishCurrency: Math.max(0, prev.fishCurrency - idlePreview.fishUsed),
        lastActiveAt: now()
      };
    });
  }, []);

  const setRestaurantStaff = useCallback((ids: string[]) => {
    setState((prev) => ({
      ...prev,
      restaurantStaffIds: ids
    }));
  }, []);

  const upgradeRestaurant = useCallback((type: 'throughput' | 'rate') => {
    setState((prev) => {
      if (prev.coins < 50) return prev;
      if (type === 'throughput') {
        return {
          ...prev,
          coins: prev.coins - 50,
          restaurant: {
            ...prev.restaurant,
            coinsPerMin: prev.restaurant.coinsPerMin + 1,
            tipsPerTap: prev.restaurant.tipsPerTap + 1
          }
        };
      }
      return {
        ...prev,
        coins: prev.coins - 50,
        restaurant: {
          ...prev.restaurant,
          customerRateSec: Math.max(15, prev.restaurant.customerRateSec - 5)
        }
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState({ ...defaultState, lastActiveAt: now() });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  const addResources = useCallback(
    (
      coins: number,
      shells: number,
      eggsByRarity: Partial<Record<Rarity, number>>,
      fishCurrency: number
    ) => {
      setState((prev) => ({
        ...prev,
        coins: prev.coins + coins,
        shells: prev.shells + shells,
        eggsByRarity: {
          ...prev.eggsByRarity,
          ...Object.fromEntries(
            Object.entries(eggsByRarity).map(([key, value]) => [
              key,
              (prev.eggsByRarity as any)[key] + (value ?? 0)
            ])
          )
        },
        fishCurrency: prev.fishCurrency + fishCurrency
      }));
    },
    []
  );

  const skipTrips = useCallback(() => {
    setState((prev) => ({
      ...prev,
      trips: prev.trips.map((trip) => ({
        ...trip,
        endsAt: Math.min(trip.endsAt, now() - 1000)
      }))
    }));
  }, []);

  const getIdlePreview = useCallback(() => calculateIdleEarnings(state), [state]);
  const getFishConsumedPerMin = useCallback(() => computeFishConsumedPerMin(state), [state]);

  const value = useMemo(
    () => ({
      state,
      loading,
      hatchEggs,
      completeIntro,
      buyEggs,
      startTrip,
      claimTrip,
      collectIdle,
      setRestaurantStaff,
      upgradeRestaurant,
      resetGame,
      addResources,
      skipTrips,
      getIdlePreview,
      getFishConsumedPerMin
    }),
    [
      state,
      loading,
      hatchEggs,
      completeIntro,
      buyEggs,
      startTrip,
      claimTrip,
      collectIdle,
      setRestaurantStaff,
      upgradeRestaurant,
      resetGame,
      addResources,
      skipTrips,
      getIdlePreview,
      getFishConsumedPerMin
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => useContext(GameContext);
