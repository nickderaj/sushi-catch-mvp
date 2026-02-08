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
import {
  LOCATIONS,
  MAX_LEVEL,
  SPECIES,
  SPECIES_GROWTH,
  XP_THRESHOLDS,
  type Rarity
} from '../data/gameData';
import { randomFish, randomRole, randomSpeciesId, rollRarity, rollStats } from '../utils/rng';
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
  const rarity = rollRarity();
  const species = SPECIES.find((s) => s.id === speciesId);
  return {
    id: createId(),
    name: species?.name ?? speciesId,
    rarity,
    role: randomRole(),
    speciesId,
    stats: rollStats(speciesId, rarity),
    xp: 0,
    level: 1,
    createdAt: now()
  };
};

const FISHING_SPECIES = SPECIES.filter((s) => s.fishingBias >= 2);

const rollTutorialCharacter = (): Character => {
  const species = FISHING_SPECIES[Math.floor(Math.random() * FISHING_SPECIES.length)];
  const rarity: Rarity = '2';
  const fishingRoles = ['Fisher', 'Diver'] as const;
  return {
    id: createId(),
    name: species.name,
    rarity,
    role: fishingRoles[Math.floor(Math.random() * fishingRoles.length)],
    speciesId: species.id,
    stats: rollStats(species.id, rarity),
    xp: 0,
    level: 1,
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

  const fishPool = Array.from(inventoryMap.values()).reduce<FishItem[]>((acc, item) => {
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

const awardXpToCharacters = (
  characters: Character[],
  charIds: string[],
  xpGain: number
): Character[] => {
  return characters.map((c) => {
    if (!charIds.includes(c.id)) return c;
    const newXp = (c.xp ?? 0) + xpGain;
    let newLevel = c.level ?? 1;
    const newStats = { ...c.stats };
    const growth = SPECIES_GROWTH[c.speciesId];

    while (newLevel < MAX_LEVEL && newXp >= XP_THRESHOLDS[newLevel + 1]) {
      newLevel++;
      newStats.power += growth.power;
      newStats.dexterity += growth.dexterity;
      newStats.speed += growth.speed;
      newStats.luck += growth.luck;
      newStats.expertise += growth.expertise;
      newStats.charisma += growth.charisma;
    }

    return { ...c, xp: newXp, level: newLevel, stats: newStats };
  });
};

const GameContext = createContext<{
  state: PlayerState;
  loading: boolean;
  busyCharacterIds: string[];
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
  renameCharacter: (characterId: string, newName: string) => void;
  resetGame: () => void;
  addCurrency: (coins: number, pearls: number, eggs: number) => void;
  skipTrips: () => void;
  skipKitchen: () => void;
  addFish: (count: number) => void;
}>({
  state: defaultState,
  loading: true,
  busyCharacterIds: [],
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
  renameCharacter: () => {},
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

  const busyCharacterIds = useMemo(() => {
    const ids = new Set<string>();
    for (const trip of state.trips) {
      if (!trip.resolved) trip.crewIds.forEach((id) => ids.add(id));
    }
    for (const shift of state.kitchenShifts) {
      if (!shift.resolved) shift.staffIds.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [state.trips, state.kitchenShifts]);

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
            let migrated = char;
            if (!migrated.speciesId) {
              const speciesId = randomSpeciesId();
              migrated = { ...migrated, speciesId, stats: rollStats(speciesId, migrated.rarity) };
            }
            if (migrated.xp == null) migrated = { ...migrated, xp: 0 };
            if (migrated.level == null) migrated = { ...migrated, level: 1 };
            return migrated;
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

  const hatchEggs = useCallback((count: number) => {
    let pulls: Character[] = [];
    setState((prev) => {
      const actual = Math.min(count, prev.eggs);
      if (actual <= 0) return prev;
      const isFirstHatch = prev.ownedCharacters.length === 0;
      if (isFirstHatch) {
        const tutorial = rollTutorialCharacter();
        const rest = Array.from({ length: actual - 1 }).map(rollCharacter);
        pulls = [tutorial, ...rest];
      } else {
        pulls = Array.from({ length: actual }).map(rollCharacter);
      }
      return {
        ...prev,
        eggs: prev.eggs - actual,
        ownedCharacters: [...pulls, ...prev.ownedCharacters]
      };
    });
    return pulls;
  }, []);

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
        ownedCharacters: awardXpToCharacters(prev.ownedCharacters, trip.crewIds, rewards.xp),
        trips: nextTrips
      };
    });
    return resolvedRewards;
  }, []);

  const startKitchenShift = useCallback((staffIds: string[], durationSec: number) => {
    if (staffIds.length === 0) return;
    setState((prev) => {
      const hasActive = prev.kitchenShifts.some((shift) => !shift.resolved && shift.endsAt > now());
      if (hasActive) return prev;
      const startedAt = now();
      const shift: KitchenShift = {
        id: createId(),
        staffIds,
        durationSec,
        startedAt,
        endsAt: startedAt + durationSec * 1000,
        resolved: false
      };
      return {
        ...prev,
        kitchenShifts: [shift, ...prev.kitchenShifts]
      };
    });
  }, []);

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
    let result = { coins: 0, served: 0 };
    setState((prev) => {
      const available = prev.fishInventory.filter((f) => f.count > 0);
      if (available.length === 0) return prev;
      const current = now();
      const delta = current - lastTapRef.current;
      if (delta < 2000) {
        comboRef.current = Math.min(prev.restaurant.comboMax, comboRef.current + 1);
      } else {
        comboRef.current = 1;
      }
      lastTapRef.current = current;
      const inventoryMap = new Map(prev.fishInventory.map((f) => [f.id, { ...f }]));
      const chosen = available[Math.floor(Math.random() * available.length)];
      const entry = inventoryMap.get(chosen.id);
      if (!entry || entry.count <= 0) return prev;
      entry.count -= 1;
      const baseCoins = calculateFishValue(entry.rarity);
      const tip = prev.restaurant.tipsPerTap * comboRef.current;
      const totalCoins = baseCoins + tip;
      const nextInventory = Array.from(inventoryMap.values()).filter((f) => f.count > 0);
      result = { coins: totalCoins, served: 1 };
      return {
        ...prev,
        coins: prev.coins + totalCoins,
        fishInventory: nextInventory
      };
    });
    return result;
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

  const renameCharacter = useCallback((characterId: string, newName: string) => {
    setState((prev) => ({
      ...prev,
      ownedCharacters: prev.ownedCharacters.map((c) =>
        c.id === characterId ? { ...c, name: newName } : c
      )
    }));
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
      busyCharacterIds,
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
      renameCharacter,
      resetGame,
      addCurrency,
      skipTrips,
      skipKitchen,
      addFish
    }),
    [
      state,
      loading,
      busyCharacterIds,
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
      renameCharacter,
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
