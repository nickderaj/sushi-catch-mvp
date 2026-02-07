import type { Rarity, Role, SpeciesId } from '../data/gameData';
import type { StatBlock } from '../utils/rng';

export type Character = {
  id: string;
  name: string;
  rarity: Rarity;
  role: Role;
  speciesId: SpeciesId;
  stats: StatBlock;
  createdAt: number;
};

export type FishItem = {
  id: string;
  name: string;
  rarity: Rarity;
  count: number;
};

export type Trip = {
  id: string;
  crewIds: string[];
  locationId: string;
  durationSec: number;
  startedAt: number;
  endsAt: number;
  resolved: boolean;
  rewards?: TripRewards;
};

export type TripRewards = {
  fish: FishItem[];
  coins: number;
  xp: number;
  mats: number;
  treasure: boolean;
  score: number;
  outcomeLabel: string;
};

export type KitchenShift = {
  id: string;
  staffIds: string[];
  durationSec: number;
  startedAt: number;
  endsAt: number;
  resolved: boolean;
  rewards?: KitchenRewards;
};

export type KitchenRewards = {
  coins: number;
  served: number;
  bonus: number;
  details: string;
};

export type RestaurantState = {
  level: number;
  coinsPerMin: number;
  tipsPerTap: number;
  customerRateSec: number;
  comboMax: number;
};

export type PlayerState = {
  introComplete: boolean;
  coins: number;
  pearls: number;
  shells: number;
  eggs: number;
  ownedCharacters: Character[];
  fishInventory: FishItem[];
  trips: Trip[];
  kitchenShifts: KitchenShift[];
  restaurant: RestaurantState;
  lastActiveAt: number;
};
