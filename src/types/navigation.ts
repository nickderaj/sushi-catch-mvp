import type { SpeciesId } from '../data/gameData';

export type RootStackParamList = {
  Menu: undefined;
  Intro: undefined;
  Game: undefined;
  PetDetail: { speciesId: SpeciesId };
};

export type GameTabParamList = {
  Hatch: undefined;
  Fish: undefined;
  Restaurant: undefined;
  Pets: undefined;
  Debug: undefined;
};
