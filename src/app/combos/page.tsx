import { loadCatalog } from "@/lib/catalog";
import { resolveAllSkins } from "@/lib/view";
import { CombosScreen } from "@/components/combos/CombosScreen";

export const metadata = { title: "Complete the Set — ThemeSet" };

export default async function CombosPage() {
  const catalog = await loadCatalog();
  const skins = resolveAllSkins(catalog);
  return <CombosScreen skins={skins} />;
}
