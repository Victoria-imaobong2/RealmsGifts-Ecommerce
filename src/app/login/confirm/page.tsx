import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confirm sign in", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Landing page for emailed sign-in links. Signing in requires pressing the
 * button (a POST), so link scanners that pre-open URLs can't use up the token.
 */
export default async function ConfirmSignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = String(Array.isArray(params.token) ? params.token[0] : params.token ?? "");
  const redirect = String(Array.isArray(params.redirect) ? params.redirect[0] : params.redirect ?? "/account");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <form method="post" action="/api/auth/verify" className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-[var(--shadow-card)] sm:p-10">
        <h1 className="text-3xl text-ink">Almost there</h1>
        <p className="mt-2 text-sm text-muted">Confirm to finish signing in to Realmsgifts on this device.</p>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="redirect" value={redirect} />
        <button type="submit" className="mt-8 h-12 w-full rounded-full bg-forest text-sm font-semibold text-ivory transition hover:bg-forest-dark">
          Sign in to Realmsgifts
        </button>
      </form>
    </div>
  );
}
