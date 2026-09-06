import { CONTES_1 } from "./data/contes1";
import { CONTES_2 } from "./data/contes2";
import { CONTES_3 } from "./data/contes3";
import { CONTES_4 } from "./data/contes4";
import { MISSIONS } from "./data/missions";
import { HISTOIRES_MUSIQUE } from "./data/histoiresMusique";
import { BEDTIME_STORIES } from "./data/bedtimeStories";
import { FAMILY_STORIES } from "./data/familyStories";
import { COMPTINES as BASE_COMPTINES } from "./data/comptines";
import { BEDTIME_MUSIC } from "./data/bedtimeMusic";
import { FAMILY_MUSIC } from "./data/familyMusic";

export const COMPTINES = [
  ...BASE_COMPTINES,
  ...BEDTIME_MUSIC,
  ...FAMILY_MUSIC,
];

export const CONTES = [
  ...CONTES_1,
  ...CONTES_2,
  ...CONTES_3,
  ...CONTES_4,
  ...MISSIONS,
  ...HISTOIRES_MUSIQUE,
  ...BEDTIME_STORIES,
  ...FAMILY_STORIES,
];
