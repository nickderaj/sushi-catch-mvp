import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATIONS } from '../data/gameData';
import { randomFish, randomName, randomRole, rollRarity, rollStats } from '../utils/rng';
import { clamp, now } from '../utils/time';
import type { Character, FishItem, PlayerState, Trip, TripRewards } from './gameTypes';

const STORAGE_KEY = 'sushi-catch-mvp-state';

const createId = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const defaultState: PlayerState = {
  introComplete: false,
  coins: 250,
  pearls: 30,
  shells: 0,
  eggs: 1,
  ownedCharacters: [],
  fishInventory: [],
  trips: [],
  restaurant: {
    level: 1,
    coinsPerMin: 5,
    tipsPerTap: 2,
    customerRateSec: 45,
    comboMax: 5
  },
  lastActiveAt: now()
};

const calculateIdleCoins = (state: PlayerState) => {
  const elapsedMs = now() - state.lastActiveAt;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const capMin = 8 * 60;
  const effectiveMin = clamp(elapsedMin, 0, capMin);
  return effectiveMin * state.restaurant.coinsPerMin;
};

const mergeFish = (inventory: FishItem[], adds: FishItem[]) => {
  const map = new Map<string, FishItem>();
  for (const item of inventory) {
    map.set(item.id, { ...item });
  }
  for (const item of adds) {
    const existing = map.get(item.id);
    if (existing) {
      existing.count += item.count;
    } else {
      map.set(item.id, { ...item });
    }
  }
  return Array.from(map.values());
};

const rollCharacter = (): Character => {
  return {
    id: createId(),
    name: randomName(),
    rarity: rollRarity(),
    role: randomRole(),
    stats: rollStats(),
    createdAt: now()
  };
};

const resolveTripRewards = (crew: Character[], locationId: string): TripRewards => {
  if (crew.length === 0) {
    return {
      fish: [],
      coins: 0,
      xp: 0,
      mats: 0,
      treasure: false,
      score: 0,
      outcomeLabel: 'No crew assigned'
    };
  }
  const statTotal = crew.reduce((sum, char) => {
    const s = char.stats;
    return sum + s.power + s.dexterity + s.speed + s.luck + s.expertise + s.charisma;
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
  const fish: FishItem[] = Array.from({ length: fishCount }).map(() => {
    const fishName = randomFish();
    return {
      id: `${locationId}-${fishName}`,
      name: fishName,
      rarity,
      count: 1
    };
  });

  return {
    fish,
    coins: score < 40 ? 5 : 20 + Math.round(score / 2),
    xp: score < 40 ? 5 : 15 + Math.round(score / 3),
    mats: score < 40 ? 0 : 1 + Math.round(score / 50),
    treasure: Math.random() < 0.02,
    score,
    outcomeLabel
  };
};

const GameContext = createContext<{
  state: PlayerState;
  loading: boolean;
  hatchEggs: (count: number) => Character[];
  completeIntro: () => void;
  buyEggs: (count: number) => void;
  startTrip: (crewIds: string[], locationId: string, durationSec: number) => void;
  claimTrip: (tripId: string) => void;
  collectIdle: () => void;
  tapServe: () => void;
  upgradeRestaurant: (type: 'throughput' | 'rate') => void;
  resetGame: () => void;
  addCurrency: (coins: number, pearls: number, eggs: number) => void;
  skipTrips: () => void;
  addFish: (count: number) => void;
}>({
  state: defaultState,
  loading: true,
  hatchEggs: () => [],
  completeIntro: () => {},
  buyEggs: () => {},
  startTrip: () => {},
  claimTrip: () => {},
  collectIdle: () => {},
  tapServe: () => {},
  upgradeRestaurant: () => {},
  resetGame: () => {},
  addCurrency: () => {},
  skipTrips: () => {},
  addFish: () => {}
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PlayerState>(defaultState);
  const [loading, setLoading] = useState(true);
  const lastTapRef = useRef(0);
  const comboRef = useRef(1);

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
          const parsed = JSON.parse(raw) as PlayerState;
          const idleCoins = calculateIdleCoins(parsed);
          const next: PlayerState = {
            ...parsed,
            coins: parsed.coins + idleCoins,
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
    (count: number) => {
      const actual = Math.min(count, state.eggs);
      if (actual <= 0) return [] as Character[];
      const pulls = Array.from({ length: actual }).map(rollCharacter);
      setState((prev) => ({
        ...prev,
        eggs: prev.eggs - actual,
        ownedCharacters: [...pulls, ...prev.ownedCharacters]
      }));
      return pulls;
    },
    [state.eggs]
  );

  const completeIntro = useCallback(() => {
    setState((prev) => ({
      ...prev,
      introComplete: true
    }));
  }, []);

  const buyEggs = useCallback((count: number) => {
    const cost = count * 10;
    setState((prev) => {
      if (prev.pearls < cost) return prev;
      return {
        ...prev,
        pearls: prev.pearls - cost,
        eggs: prev.eggs + count
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
    setState((prev) => {
      const trip = prev.trips.find((t) => t.id === tripId);
      if (!trip) return prev;
      if (trip.resolved) return prev;
      if (trip.endsAt > now()) return prev;
      const crew = prev.ownedCharacters.filter((c) => trip.crewIds.includes(c.id));
      const rewards = resolveTripRewards(crew, trip.locationId);
      const nextTrips = prev.trips.map((t) =>
        t.id === tripId ? { ...t, resolved: true, rewards } : t
      );
      return {
        ...prev,
        coins: prev.coins + rewards.coins,
        fishInventory: mergeFish(prev.fishInventory, rewards.fish),
        trips: nextTrips
      };
    });
  }, []);

  const collectIdle = useCallback(() => {
    setState((prev) => {
      const idleCoins = calculateIdleCoins(prev);
      return {
        ...prev,
        coins: prev.coins + idleCoins,
        lastActiveAt: now()
      };
    });
  }, []);

  const tapServe = useCallback(() => {
    setState((prev) => {
      const current = now();
      const delta = current - lastTapRef.current;
      if (delta < 2000) {
        comboRef.current = Math.min(prev.restaurant.comboMax, comboRef.current + 1);
      } else {
        comboRef.current = 1;
      }
      lastTapRef.current = current;
      const tip = prev.restaurant.tipsPerTap * comboRef.current;
      return {
        ...prev,
        coins: prev.coins + tip
      };
    });
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

  const addCurrency = useCallback((coins: number, pearls: number, eggs: number) => {
    setState((prev) => ({
      ...prev,
      coins: prev.coins + coins,
      pearls: prev.pearls + pearls,
      eggs: prev.eggs + eggs
    }));
  }, []);

  const skipTrips = useCallback(() => {
    setState((prev) => ({
      ...prev,
      trips: prev.trips.map((trip) => ({
        ...trip,
        endsAt: Math.min(trip.endsAt, now() - 1000)
      }))
    }));
  }, []);

  const addFish = useCallback((count: number) => {
    const additions: FishItem[] = Array.from({ length: count }).map(() => {
      const fishName = randomFish();
      return {
        id: `debug-${fishName}`,
        name: fishName,
        rarity: rollRarity(),
        count: 1
      };
    });
    setState((prev) => ({
      ...prev,
      fishInventory: mergeFish(prev.fishInventory, additions)
    }));
  }, []);

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
      tapServe,
      upgradeRestaurant,
      resetGame,
      addCurrency,
      skipTrips,
      addFish
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
      tapServe,
      upgradeRestaurant,
      resetGame,
      addCurrency,
      skipTrips,
      addFish
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => useContext(GameContext);
