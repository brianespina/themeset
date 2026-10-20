import { loadCatalog } from "@/lib/catalog";
import { resolveAllSkins } from "@/lib/view";
import { GenerateScreen } from "@/components/generate/GenerateScreen";

export const metadata = { title: "Random theme generator — ThemeSet" };

export default async function GeneratePage() {
  const catalog = await loadCatalog();
  const skins = resolveAllSkins(catalog);
  return <GenerateScreen skins={skins} />;
}
