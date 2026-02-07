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
import {
  randomFish,
  randomName,
  randomRole,
  randomSpeciesId,
  rollRarity,
  rollStats
} from '../utils/rng';
import { clamp, now } from '../utils/time';
import type {
  Character,
  FishItem,
  KitchenRewards,
  KitchenShift,
  PlayerState,
  Trip,
  TripRewards
} from './gameTypes';

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
  kitchenShifts: [],
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
  const speciesId = randomSpeciesId();
  return {
    id: createId(),
    name: randomName(),
    rarity: rollRarity(),
    role: randomRole(),
    speciesId,
    stats: rollStats(speciesId),
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

const calculateFishValue = (rarity: FishItem['rarity']) => {
  switch (rarity) {
    case '5':
      return 30;
    case '4':
      return 20;
    case '3':
      return 14;
    case '2':
      return 10;
    default:
      return 6;
  }
};

const resolveKitchenRewards = (staff: Character[], durationSec: number, inventory: FishItem[]) => {
  if (staff.length === 0) {
    return {
      rewards: { coins: 0, served: 0, bonus: 0, details: 'No staff assigned.' },
      nextInventory: inventory
    };
  }

  const totalFish = inventory.reduce((sum, item) => sum + item.count, 0);
  if (totalFish === 0) {
    return {
      rewards: { coins: 0, served: 0, bonus: 0, details: 'No fish to serve.' },
      nextInventory: inventory
    };
  }

  const hours = durationSec / 3600;
  const baseServe = Math.max(1, Math.floor(hours * 3));
  const serveCount = Math.min(baseServe, totalFish);

  const staffSkill = staff.reduce(
    (sum, char) => sum + char.stats.expertise + char.stats.charisma,
    0
  );
  const bonus = Math.round(staffSkill / 20);

  const inventoryMap = new Map(inventory.map((item) => [item.id, { ...item }]));
  let coins = 0;
  let served = 0;

  const fishPool = inventoryMap.values().reduce<FishItem[]>((acc, item) => {
    for (let i = 0; i < item.count; i += 1) acc.push(item);
    return acc;
  }, []);

  for (let i = 0; i < serveCount; i += 1) {
    const fish = fishPool[Math.floor(Math.random() * fishPool.length)];
    if (!fish) break;
    const entry = inventoryMap.get(fish.id);
    if (!entry || entry.count <= 0) continue;
    entry.count -= 1;
    coins += calculateFishValue(entry.rarity);
    served += 1;
  }

  const nextInventory = Array.from(inventoryMap.values()).filter((item) => item.count > 0);
  return {
    rewards: {
      coins: coins + bonus,
      served,
      bonus,
      details: served === 0 ? 'No fish served.' : `Served ${served} fish.`
    },
    nextInventory
  };
};

const GameContext = createContext<{
  state: PlayerState;
  loading: boolean;
  hatchEggs: (count: number) => Character[];
  completeIntro: () => void;
  buyEggs: (count: number) => void;
  startTrip: (crewIds: string[], locationId: string, durationSec: number) => void;
  claimTrip: (tripId: string) => TripRewards | null;
  startKitchenShift: (staffIds: string[], durationSec: number) => void;
  claimKitchenShift: (shiftId: string) => KitchenRewards | null;
  collectIdle: () => void;
  tapServe: (fishIds: string[]) => { coins: number; served: number };
  autoServe: () => { coins: number; served: number };
  upgradeRestaurant: (type: 'throughput' | 'rate') => void;
  resetGame: () => void;
  addCurrency: (coins: number, pearls: number, eggs: number) => void;
  skipTrips: () => void;
  skipKitchen: () => void;
  addFish: (count: number) => void;
}>({
  state: defaultState,
  loading: true,
  hatchEggs: () => [],
  completeIntro: () => {},
  buyEggs: () => {},
  startTrip: () => {},
  claimTrip: () => null,
  startKitchenShift: () => {},
  claimKitchenShift: () => null,
  collectIdle: () => {},
  tapServe: () => ({ coins: 0, served: 0 }),
  autoServe: () => ({ coins: 0, served: 0 }),
  upgradeRestaurant: () => {},
  resetGame: () => {},
  addCurrency: () => {},
  skipTrips: () => {},
  skipKitchen: () => {},
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
          const migratedCharacters = parsed.ownedCharacters.map((char) => {
            if (!char.speciesId) {
              const speciesId = randomSpeciesId();
              return { ...char, speciesId, stats: rollStats(speciesId) };
            }
            return char;
          });
          const next: PlayerState = {
            ...parsed,
            ownedCharacters: migratedCharacters,
            kitchenShifts: parsed.kitchenShifts ?? [],
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
        fishInventory: mergeFish(prev.fishInventory, rewards.fish),
        trips: nextTrips
      };
    });
    return resolvedRewards;
  }, []);

  const startKitchenShift = useCallback(
    (staffIds: string[], durationSec: number) => {
      if (staffIds.length === 0) return;
      const hasActive = state.kitchenShifts.some(
        (shift) => !shift.resolved && shift.endsAt > now()
      );
      if (hasActive) return;
      const startedAt = now();
      const shift: KitchenShift = {
        id: createId(),
        staffIds,
        durationSec,
        startedAt,
        endsAt: startedAt + durationSec * 1000,
        resolved: false
      };
      setState((prev) => ({
        ...prev,
        kitchenShifts: [shift, ...prev.kitchenShifts]
      }));
    },
    [state.kitchenShifts]
  );

  const claimKitchenShift = useCallback((shiftId: string) => {
    let resolvedRewards: KitchenRewards | null = null;
    setState((prev) => {
      const shift = prev.kitchenShifts.find((s) => s.id === shiftId);
      if (!shift) return prev;
      if (shift.resolved) return prev;
      if (shift.endsAt > now()) return prev;
      const staff = prev.ownedCharacters.filter((c) => shift.staffIds.includes(c.id));
      const { rewards, nextInventory } = resolveKitchenRewards(
        staff,
        shift.durationSec,
        prev.fishInventory
      );
      resolvedRewards = rewards;
      const nextShifts = prev.kitchenShifts.map((s) =>
        s.id === shiftId ? { ...s, resolved: true, rewards } : s
      );
      return {
        ...prev,
        coins: prev.coins + rewards.coins,
        fishInventory: nextInventory,
        kitchenShifts: nextShifts
      };
    });
    return resolvedRewards;
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

  const tapServe = useCallback((fishIds: string[]) => {
    let result = { coins: 0, served: 0 };
    setState((prev) => {
      if (fishIds.length === 0) return prev;
      const current = now();
      const delta = current - lastTapRef.current;
      if (delta < 2000) {
        comboRef.current = Math.min(prev.restaurant.comboMax, comboRef.current + 1);
      } else {
        comboRef.current = 1;
      }
      lastTapRef.current = current;
      const inventoryMap = new Map(prev.fishInventory.map((f) => [f.id, { ...f }]));
      const available = fishIds
        .map((id) => inventoryMap.get(id))
        .filter((fish): fish is FishItem => !!fish && fish.count > 0);
      if (available.length === 0) return prev;
      const chosen = available[Math.floor(Math.random() * available.length)];
      chosen.count -= 1;
      const baseCoins = calculateFishValue(chosen.rarity);
      const served = 1;
      const nextInventory = Array.from(inventoryMap.values()).filter((f) => f.count > 0);
      const tip = prev.restaurant.tipsPerTap * comboRef.current;
      const totalCoins = baseCoins + tip;
      result = { coins: totalCoins, served };
      return {
        ...prev,
        coins: prev.coins + totalCoins,
        fishInventory: nextInventory
      };
    });
    return result;
  }, []);

  const autoServe = useCallback(() => {
    const available = state.fishInventory.filter((f) => f.count > 0).map((f) => f.id);
    return tapServe(available);
  }, [state.fishInventory, tapServe]);

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

  const skipKitchen = useCallback(() => {
    setState((prev) => ({
      ...prev,
      kitchenShifts: prev.kitchenShifts.map((shift) => ({
        ...shift,
        endsAt: Math.min(shift.endsAt, now() - 1000)
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
      startKitchenShift,
      claimKitchenShift,
      collectIdle,
      tapServe,
      autoServe,
      upgradeRestaurant,
      resetGame,
      addCurrency,
      skipTrips,
      skipKitchen,
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
      startKitchenShift,
      claimKitchenShift,
      collectIdle,
      tapServe,
      autoServe,
      upgradeRestaurant,
      resetGame,
      addCurrency,
      skipTrips,
      skipKitchen,
      addFish
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => useContext(GameContext);
