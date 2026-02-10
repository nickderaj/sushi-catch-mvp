import type { Rarity, Role, SpeciesId } from '../data/gameData';
import type { StatBlock } from '../utils/rng';

export type Character = {
  id: string;
  name: string;
  rarity: Rarity;
  role: Role;
  speciesId: SpeciesId;
  level: number;
  xp: number;
  stats: StatBlock;
  fishingTrips: number;
  restaurantMinutes: number;
  coinsFromRestaurant: number;
  fishCollected: number;
  treasuresCollected: number;
  createdAt: number;
};

export type FishReward = {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
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
  fish: FishReward[];
  fishCurrency: number;
  coins: number;
  xp: number;
  shells: number;
  treasure: boolean;
  score: number;
  outcomeLabel: string;
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
  shells: number;
  eggsByRarity: Record<Rarity, number>;
  fishCurrency: number;
  ownedCharacters: Character[];
  trips: Trip[];
  restaurantStaffIds: string[];
  restaurant: RestaurantState;
  lastActiveAt: number;
};
