import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/auth/redirect";
import { SignInPanel } from "@/components/auth/SignInPanel";

export const metadata = {
  title: "Sign in — ThemeSet",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);

  // Already signed in — nothing to do here.
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <main className="flex items-start justify-center px-12 py-20">
      <SignInPanel next={next} initialError={error} configured={isSupabaseConfigured()} />
    </main>
  );
}
