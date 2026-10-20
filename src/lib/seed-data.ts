// Seed content ported verbatim from the design prototype (ThemeSet.dc.html).
// 40 hand-curated skins, 14 themes, 10 sets, 12 colours, 5 creators, 12 slots.
// c1/c2/c3 are hand-picked (primary, dark, accent) — they drive the SkinArt
// silhouette fallback and pairMatch(); a future csgoskins/SkinBaron colour
// feed could replace them, but SkinBaron doesn't ship a palette either, so
// these stay authoritative for now.

export interface Skin {
  id: string;
  w: string; // weapon group: knife | gloves | ak | m4 | awp | pistol
  wl: string; // weapon label, e.g. "AK-47"
  n: string; // paint/skin name
  p: number; // placeholder USD price, used only when no live price resolves
  ex: string; // exterior short code: FN | MW | FT | WW | BS
  c1: string;
  c2: string;
  c3: string;
  col: string; // collection
  rar: string; // rarity
  tags: string[];
}

const SK_RAW: [
  string,
  string,
  string,
  string,
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  string[],
][] = [
  ["karambit-lore", "knife", "Karambit", "Lore", 3450, "FN", "#C9A227", "#1E1E23", "#E7D28A", "Gamma", "Covert", ["gold", "luxury", "black"]],
  ["karambit-doppler", "knife", "Karambit", "Doppler Phase 2", 1180, "FN", "#8E4FA8", "#26262C", "#E0C3F0", "Chroma", "Covert", ["purple", "royal", "luxury"]],
  ["m9-crimson", "knife", "M9 Bayonet", "Crimson Web", 1620, "MW", "#7E1F27", "#141418", "#C0343E", "Bravo", "Covert", ["red", "dark", "aggressive"]],
  ["butterfly-fade", "knife", "Butterfly Knife", "Fade", 2380, "FN", "#E06A3A", "#1C1C21", "#F0C24A", "Breakout", "Covert", ["orange", "gold", "luxury"]],
  ["butterfly-damascus", "knife", "Butterfly Knife", "Damascus Steel", 1450, "FN", "#C9C9D2", "#2A2A31", "#8E8E98", "Gamma", "Covert", ["white", "minimal", "clean"]],
  ["talon-marble", "knife", "Talon Knife", "Marble Fade", 1290, "FN", "#C0392B", "#2B2B33", "#2F6FB0", "Horizon", "Covert", ["multicolor", "colorful"]],
  ["huntsman-tiger", "knife", "Huntsman Knife", "Tiger Tooth", 780, "FN", "#D8A72A", "#1B1B20", "#3A3A44", "Chroma", "Covert", ["gold", "minimal"]],
  ["ursus-night", "knife", "Ursus Knife", "Night Stripe", 240, "MW", "#232329", "#3A3A44", "#8E8E98", "Horizon", "Covert", ["dark", "black", "tactical"]],
  ["flip-emerald", "knife", "Flip Knife", "Gamma Doppler", 640, "FN", "#2F7F4F", "#1A1E1C", "#3FBF86", "Gamma", "Covert", ["green", "toxic"]],
  ["sport-scarlet", "gloves", "Sport Gloves", "Scarlet Shamagh", 1240, "MW", "#7E1F27", "#1E1E23", "#C0343E", "Glove", "Extraordinary", ["red", "tactical"]],
  ["sport-pandora", "gloves", "Sport Gloves", "Pandora’s Box", 2650, "FN", "#8E4FA8", "#242429", "#C89BDA", "Glove", "Extraordinary", ["purple", "royal", "luxury"]],
  ["sport-vice", "gloves", "Sport Gloves", "Vice", 1420, "MW", "#C0507A", "#232329", "#2FA0C0", "Glove", "Extraordinary", ["pink", "neon", "colorful"]],
  ["sport-omega", "gloves", "Sport Gloves", "Omega", 980, "MW", "#C9B8A8", "#1E1E23", "#8E8E98", "Glove", "Extraordinary", ["white", "minimal", "clean"]],
  ["specialist-fade", "gloves", "Specialist Gloves", "Fade", 1580, "MW", "#E0703C", "#1F1F24", "#F2C24C", "Glove", "Extraordinary", ["orange", "gold"]],
  ["specialist-kimono", "gloves", "Specialist Gloves", "Crimson Kimono", 860, "FT", "#8C2530", "#17171B", "#D4444F", "Glove", "Extraordinary", ["red", "dark"]],
  ["driver-lunar", "gloves", "Driver Gloves", "Lunar Weave", 380, "FT", "#C9A227", "#1E1E23", "#8E7A3A", "Glove", "Extraordinary", ["gold", "luxury"]],
  ["bloodhound-charred", "gloves", "Bloodhound Gloves", "Charred", 260, "FT", "#2A2A2E", "#17171B", "#6A6A72", "Glove", "Extraordinary", ["dark", "black", "tactical"]],
  ["hydra-emerald", "gloves", "Hydra Gloves", "Emerald", 340, "MW", "#1F6B4A", "#181C1A", "#3FBF86", "Glove", "Extraordinary", ["green", "toxic"]],
  ["ak-empress", "ak", "AK-47", "The Empress", 82.4, "MW", "#B03A3A", "#2A2A31", "#D9C48A", "Spectrum", "Covert", ["red", "luxury"]],
  ["ak-redline", "ak", "AK-47", "Redline", 38.1, "FT", "#A32B2B", "#1D1D22", "#C9C9D2", "Winter Offensive", "Classified", ["red", "tactical"]],
  ["ak-fuel", "ak", "AK-47", "Fuel Injector", 96, "MW", "#C2402E", "#26262C", "#E0863F", "Gamma", "Covert", ["red", "aggressive", "orange"]],
  ["ak-neonrider", "ak", "AK-47", "Neon Rider", 62, "FN", "#2C7FBF", "#211E2B", "#E24E8C", "Horizon", "Covert", ["neon", "colorful", "blue"]],
  ["ak-asiimov", "ak", "AK-47", "Asiimov", 74, "FT", "#E4E4EA", "#26262B", "#E07A2A", "Asiimov", "Covert", ["white", "futuristic"]],
  ["m4a1-printstream", "m4", "M4A1-S", "Printstream", 128, "MW", "#E8E8EE", "#1C1C21", "#8E8E98", "Prisma 2", "Covert", ["white", "minimal", "clean"]],
  ["m4a1-lotus", "m4", "M4A1-S", "Black Lotus", 46, "FN", "#232329", "#5A2A55", "#C05A8C", "Shattered Web", "Classified", ["dark", "black", "purple"]],
  ["m4a1-goldencoil", "m4", "M4A1-S", "Golden Coil", 34, "MW", "#C8A23A", "#1E1E23", "#2F7F4F", "Spectrum", "Classified", ["gold", "green"]],
  ["m4a4-desolate", "m4", "M4A4", "Desolate Space", 42, "MW", "#2A3A5A", "#1B1B21", "#D06A3A", "Gamma", "Classified", ["blue", "futuristic"]],
  ["m4a4-howl", "m4", "M4A4", "Howl", 4200, "MW", "#C2402E", "#26262C", "#E8E8EE", "Huntsman", "Contraband", ["red", "luxury", "aggressive"]],
  ["awp-hyperbeast", "awp", "AWP", "Hyper Beast", 92, "MW", "#C0392B", "#2B2B33", "#2F9FB0", "Falchion", "Covert", ["colorful", "red"]],
  ["awp-asiimov", "awp", "AWP", "Asiimov", 118, "FT", "#E4E4EA", "#26262B", "#E07A2A", "Phoenix", "Covert", ["white", "futuristic"]],
  ["awp-neonoir", "awp", "AWP", "Neo-Noir", 88, "FN", "#B02A6A", "#1B1B21", "#2FA0C0", "Prisma", "Covert", ["pink", "neon"]],
  ["awp-atheris", "awp", "AWP", "Atheris", 28, "MW", "#2C6B4A", "#1A1E1C", "#3FBF86", "Danger Zone", "Classified", ["green", "toxic"]],
  ["usp-printstream", "pistol", "USP-S", "Printstream", 84, "FN", "#E8E8EE", "#1C1C21", "#8E8E98", "Prisma 2", "Covert", ["white", "minimal", "clean"]],
  ["usp-kill", "pistol", "USP-S", "Kill Confirmed", 96, "MW", "#A83030", "#1E1E23", "#E8E8EE", "Shadow", "Covert", ["red", "dark"]],
  ["glock-vogue", "pistol", "Glock-18", "Vogue", 21, "FN", "#C0507A", "#232329", "#E4C7A0", "Prisma", "Restricted", ["pink", "colorful"]],
  ["glock-neonoir", "pistol", "Glock-18", "Neo-Noir", 18, "MW", "#B02A6A", "#1B1B21", "#2FA0C0", "Prisma", "Restricted", ["pink", "neon"]],
  ["deagle-blaze", "pistol", "Desert Eagle", "Blaze", 720, "FN", "#D8722A", "#1C1C21", "#F0B23C", "Dust", "Restricted", ["orange", "gold"]],
  ["deagle-printstream", "pistol", "Desert Eagle", "Printstream", 58, "MW", "#E8E8EE", "#1C1C21", "#8E8E98", "Recoil", "Covert", ["white", "minimal"]],
  ["five-monkey", "pistol", "Five-SeveN", "Monkey Business", 12, "FN", "#2F7F4F", "#1A1E1C", "#E0C24A", "Chroma", "Classified", ["green", "colorful"]],
  ["tec9-fuel", "pistol", "Tec-9", "Fuel Injector", 24, "MW", "#C2402E", "#26262C", "#E0863F", "Gamma", "Classified", ["red", "orange"]],
];

export const SKINS: Skin[] = SK_RAW.map((r) => ({
  id: r[0],
  w: r[1],
  wl: r[2],
  n: r[3],
  p: r[4],
  ex: r[5],
  c1: r[6],
  c2: r[7],
  c3: r[8],
  col: r[9],
  rar: r[10],
  tags: r[11],
}));

export interface Theme {
  name: string;
  accent: string;
  tag: string;
  swatch: [string, string, string];
  count: number;
}

const THEMES_RAW: [string, string, string, [string, string, string], number][] = [
  ["Crimson", "#E0453C", "red", ["#8C2028", "#1A1A1E", "#D4444F"], 412],
  ["Midnight", "#5B7BE0", "dark", ["#1E2233", "#141417", "#5B7BE0"], 318],
  ["Royal Purple", "#9B5FD0", "purple", ["#4A2A66", "#1C1A22", "#C89BDA"], 276],
  ["Whiteout", "#E8E8EE", "white", ["#E8E8EE", "#8E8E98", "#1C1C21"], 254],
  ["Gold", "#D9AE43", "gold", ["#C9A227", "#1E1E23", "#E7D28A"], 231],
  ["Toxic", "#8FD93A", "toxic", ["#2F7F4F", "#161A17", "#3FBF86"], 198],
  ["Cyberpunk", "#E24E8C", "neon", ["#B02A6A", "#1B1B21", "#2FA0C0"], 184],
  ["Ice", "#6FC8E8", "blue", ["#2C6B8F", "#15181C", "#8FD4EA"], 166],
  ["Emerald", "#3FBF86", "green", ["#1F6B4A", "#151A17", "#3FBF86"], 142],
  ["Tactical", "#9AA870", "tactical", ["#3A3E2E", "#17171B", "#8E9A6B"], 131],
  ["Luxury", "#C9A227", "luxury", ["#C9A227", "#22222A", "#E8E8EE"], 118],
  ["Minimal", "#C9C9D2", "minimal", ["#E8E8EE", "#1C1C21", "#8E8E98"], 104],
  ["Pink", "#E86AA8", "pink", ["#C0507A", "#232329", "#E4C7A0"], 96],
  ["Neon", "#3AE0C0", "neon", ["#2C7FBF", "#211E2B", "#E24E8C"], 88],
];

export const THEMES: Theme[] = THEMES_RAW.map((t) => ({
  name: t[0],
  accent: t[1],
  tag: t[2],
  swatch: t[3],
  count: t[4],
}));

export const DEFAULT_THEME = "Crimson";

export interface SetDef {
  slug: string;
  name: string;
  creator: string;
  theme: string;
  score: number;
  likes: number;
  skinIds: string[];
  blurb: string;
}

const SETS_RAW: [string, string, string, string, number, number, string[], string][] = [
  ["crimson-phantom", "Crimson Phantom", "@vertigo_", "Crimson", 94, 2841, ["m9-crimson", "sport-scarlet", "ak-empress", "m4a4-howl", "awp-hyperbeast", "usp-kill", "glock-vogue"], "Red on black, nothing else. Every piece carries the same web-and-blood palette so the set reads as one thing in-hand."],
  ["ivory-protocol", "Ivory Protocol", "@nade_lineup", "Whiteout", 91, 2104, ["butterfly-damascus", "sport-omega", "ak-asiimov", "m4a1-printstream", "awp-asiimov", "usp-printstream", "deagle-printstream"], "Printstream core with Asiimov long guns. Clean whites, grey panelling, one orange accent to keep it from going clinical."],
  ["neon-district", "Neon District", "@cyberdust", "Cyberpunk", 93, 1877, ["karambit-doppler", "sport-vice", "ak-neonrider", "m4a1-lotus", "awp-neonoir", "glock-neonoir", "tec9-fuel"], "Vice gloves set the pink/teal split and the rest follows. Loud, but the hues are locked so it never turns into a sticker sheet."],
  ["royal-decay", "Royal Decay", "@kennyS_fan", "Royal Purple", 89, 1493, ["karambit-doppler", "sport-pandora", "m4a1-lotus", "awp-neonoir", "glock-neonoir", "ak-neonrider"], "Doppler Phase 2 and Pandora’s Box do the heavy lifting. Black Lotus keeps the mid-tier from washing out."],
  ["venom-strike", "Venom Strike", "@clutchmerchant", "Toxic", 92, 1288, ["flip-emerald", "hydra-emerald", "awp-atheris", "m4a1-goldencoil", "five-monkey", "ak-redline"], "Gamma green through the knife and gloves, with Atheris carrying it into the AWP slot."],
  ["gilded", "Gilded", "@dust2_daily", "Gold", 90, 1142, ["karambit-lore", "driver-lunar", "ak-empress", "deagle-blaze", "m4a1-goldencoil", "huntsman-tiger"], "Lore gold as the anchor. Warm metals only — nothing cool allowed in the set."],
  ["blush", "Blush", "@pinkmirage", "Pink", 88, 964, ["talon-marble", "sport-vice", "awp-neonoir", "glock-vogue", "ak-neonrider", "m4a1-lotus"], "Soft pinks with a cyan release valve. Marble Fade ties the knife into the weapon hues."],
  ["range-ready", "Range Ready", "@eco_round", "Tactical", 84, 812, ["ursus-night", "bloodhound-charred", "ak-redline", "m4a4-desolate", "awp-atheris", "tec9-fuel"], "Full set for the price of one mid knife. Muted greys and one red line running through it."],
  ["frostline", "Frostline", "@icebox_", "Ice", 86, 745, ["butterfly-damascus", "sport-omega", "m4a1-printstream", "m4a4-desolate", "deagle-printstream", "usp-printstream"], "Damascus and Omega set a cold grey base; Desolate Space adds the only real blue."],
  ["midnight-ops", "Midnight Ops", "@smokecrim", "Midnight", 87, 689, ["ursus-night", "bloodhound-charred", "m4a1-lotus", "ak-redline", "usp-kill", "awp-atheris"], "Nearly black across the board. Reads as gear, not skins."],
];

export const SETS: SetDef[] = SETS_RAW.map((r) => ({
  slug: r[0],
  name: r[1],
  creator: r[2],
  theme: r[3],
  score: r[4],
  likes: r[5],
  skinIds: r[6],
  blurb: r[7],
}));

export interface ColorDef {
  name: string;
  hex: string;
  count: number;
}

export const COLORS: ColorDef[] = [
  ["Red", "#B03A3A", 1284], ["Orange", "#D8722A", 412], ["Yellow", "#D9C43A", 196],
  ["Green", "#2F7F4F", 508], ["Cyan", "#2FA0C0", 274], ["Blue", "#2C6B8F", 742],
  ["Purple", "#8E4FA8", 631], ["Pink", "#C0507A", 389], ["White", "#E8E8EE", 864],
  ["Black", "#232329", 1103], ["Gold", "#C9A227", 298], ["Silver", "#B9B9C2", 341],
].map(([name, hex, count]) => ({ name: name as string, hex: hex as string, count: count as number }));

export interface CreatorDef {
  handle: string;
  setCount: number;
  avgScore: string;
}

export const CREATORS: CreatorDef[] = [
  ["@vertigo_", 34, "91"], ["@cyberdust", 28, "89"], ["@nade_lineup", 21, "90"],
  ["@pinkmirage", 17, "87"], ["@eco_round", 12, "85"],
].map(([handle, setCount, avgScore]) => ({
  handle: handle as string,
  setCount: setCount as number,
  avgScore: avgScore as string,
}));

export interface SlotDef {
  id: string;
  label: string;
  group: string;
}

export const SLOTS: SlotDef[] = [
  ["knife", "Knife", "knife"], ["gloves", "Gloves", "gloves"],
  ["ak", "AK-47", "ak"], ["m4a4", "M4A4", "m4"], ["m4a1", "M4A1-S", "m4"],
  ["awp", "AWP", "awp"], ["ssg", "SSG 08", "awp"],
  ["usp", "USP-S", "pistol"], ["glock", "Glock-18", "pistol"], ["deagle", "Desert Eagle", "pistol"],
  ["p2000", "P2000", "pistol"], ["tec9", "Tec-9", "pistol"],
].map(([id, label, group]) => ({ id: id as string, label: label as string, group: group as string }));

export function skinById(id: string): Skin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

export function themeByName(name: string | undefined): Theme {
  return THEMES.find((t) => t.name === (name || DEFAULT_THEME)) ?? THEMES[0];
}

export function setBySlug(slug: string): SetDef {
  return SETS.find((s) => s.slug === slug) ?? SETS[0];
}
