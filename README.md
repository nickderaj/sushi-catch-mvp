# Sushi Catch Tycoon MVP

A React Native idle-tycoon / gacha collection game built with Expo. Hatch creatures from eggs, send fishing crews on expeditions, and run a sushi restaurant.

## Getting Started

### Prerequisites

- Node.js >= 18
- [pnpm](https://pnpm.io/) package manager
- iOS Simulator (Xcode) or Expo Go on a physical device

### Install & Run

```bash
pnpm install
pnpm start        # Start the Expo dev server
pnpm run ios      # Launch on iOS simulator
```

## Project Structure

```
├── index.js                    # App entry point (registerRootComponent)
├── App.tsx                     # Root component: navigation setup
├── src/
│   ├── state/
│   │   ├── GameContext.tsx      # React Context provider: all game state & actions
│   │   └── gameTypes.ts        # TypeScript types (Character, Trip, PlayerState, etc.)
│   ├── data/
│   │   └── gameData.ts         # Game constants: species, fish, locations, rates
│   ├── screens/
│   │   ├── MenuScreen.tsx      # Start menu
│   │   ├── IntroScreen.tsx     # First-egg onboarding
│   │   ├── HatchScreen.tsx     # Gacha egg hatching
│   │   ├── FishScreen.tsx      # Fishing expedition management
│   │   ├── RestaurantScreen.tsx# Idle clicker restaurant
│   │   ├── PetsScreen.tsx      # Creature collection grid
│   │   ├── PetDetailScreen.tsx # Species detail view
│   │   └── DebugScreen.tsx     # Dev tools (add currency, skip timers)
│   ├── components/
│   │   ├── PrimaryButton.tsx   # Styled button with press animation
│   │   └── StatBlock.tsx       # Character stat display
│   ├── types/
│   │   └── navigation.ts      # React Navigation type definitions
│   └── utils/
│       ├── rng.ts              # Gacha RNG engine (rarity rolls, stat generation)
│       ├── sfx.ts              # Sound effects (expo-av)
│       └── time.ts             # Time formatting & clamping
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── sfx/                    # egg_crack.wav, reward.wav
└── sushi_mechanics(1).json     # Game design document
```

## Game Mechanics

### Core Loops

**Gacha Hatching** - Spend eggs to hatch random creatures. Each creature has a species, rarity (Common through Legendary), role, and 6 stats. Buy eggs with pearls.

**Fishing Expeditions** - Assign 1-3 crew members, pick a location and duration (10s/30s/60s). Crew stats determine haul quality (score-based rarity table). Rewards: fish, coins, XP, materials, rare treasure.

**Restaurant** - Tap to serve customers with combo multiplier. Auto-serve from inventory. Assign kitchen staff for timed shifts (2h/4h/8h). Idle coin generation (capped at 8 hours offline). Upgrade throughput and customer rate.

**Collection** - 8 creature species with unique stat distributions and fishing/kitchen biases. Track highest rarity per species in the dex grid.

### Species

| Species          | Strength             | Fishing Bias | Kitchen Bias |
| ---------------- | -------------------- | :----------: | :----------: |
| Koi Sprite       | Balanced             |      2       |      1       |
| Tanuki Trickster | Speed / Luck         |      2       |      0       |
| Axolotl Diver    | Dexterity / Luck     |      3       |      0       |
| Crane Chef       | Expertise / Charisma |      0       |      3       |
| Harbor Seal      | Service-focused      |      0       |      3       |
| Catfish Captain  | High Power           |      3       |      0       |
| Ink Squid        | Balanced hybrid      |      2       |      1       |
| Sea Turtle       | Stable / Lucky       |      1       |      1       |

### Rarity Rates

| Rarity    | Weight |
| --------- | ------ |
| Common    | 51.2%  |
| Uncommon  | 30%    |
| Rare      | 15%    |
| Epic      | 3%     |
| Legendary | 0.8%   |

### Stat System

Each creature has 6 stats derived from species baseline + bias bonuses + random variance:

- **Power, Dexterity, Speed, Luck** - Fishing effectiveness
- **Expertise, Charisma** - Kitchen/restaurant quality

## Tech Stack

- **Expo SDK 54** / React Native 0.81
- **React Navigation** (native stack + bottom tabs)
- **AsyncStorage** for state persistence
- **expo-av** for sound effects
- **expo-haptics** for tactile feedback
- **TypeScript** (strict mode)
- **Prettier** + **Husky/lint-staged** for code formatting

## Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `pnpm start`       | Start Expo dev server          |
| `pnpm run ios`     | Run on iOS simulator           |
| `pnpm run android` | Run on Android                 |
| `pnpm run web`     | Run web version                |
| `pnpm run format`  | Format all files with Prettier |
