import { loadCatalog } from "@/lib/catalog";
import { resolveAllSkins } from "@/lib/view";
import { getCurrentUser } from "@/lib/auth/dal";
import { BuildScreen } from "@/components/build/BuildScreen";

export const metadata = { title: "Build — ThemeSet" };

export default async function BuildPage() {
  const catalog = await loadCatalog();
  const skins = resolveAllSkins(catalog);
  // The builder itself stays open to everyone — only saving needs an account,
  // so we pass sign-in state down rather than gating the page.
  const user = await getCurrentUser();
  return <BuildScreen skins={skins} signedIn={user !== null} />;
}
