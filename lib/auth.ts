import { createClient } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// User helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current session from local storage — fast, no network call.
 * Use this for non-security-critical reads (UI state, displaying name, etc.).
 * The JWT inside the session is automatically attached to every Supabase query.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session;
}

/**
 * Returns the authenticated user by validating the session with the Supabase
 * server — slower than getSession() but always trustworthy.
 * Use this before any security-sensitive operation (score save, data write).
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Returns the best display name for a user.
 * Priority: custom display_name → OAuth full_name → OAuth username → email prefix.
 */
export function getDisplayName(user: User): string {
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "Anonymous"
  );
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Signs the current user out and clears the local session.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * Subscribe to auth state changes. Fires immediately with the current session,
 * then on every sign-in / sign-out / token-refresh event.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 *
 * Uses getSession() for the immediate snapshot (fast) and
 * onAuthStateChange for all subsequent updates.
 */
export function subscribeToAuth(
  callback: (user: User | null, session: Session | null) => void
): () => void {
  const supabase = createClient();

  // Fire immediately with local session (no network request)
  supabase.auth.getSession().then(({ data }) => {
    callback(data.session?.user ?? null, data.session ?? null);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session ?? null);
  });

  return () => subscription.unsubscribe();
}

// ---------------------------------------------------------------------------
// Route protection (standalone — no React needed)
// ---------------------------------------------------------------------------

/**
 * Checks whether a user is authenticated.
 * If not, runs onUnauthenticated() (e.g. open login modal).
 * Returns true if the user is authenticated, false otherwise.
 *
 * Call this before any protected action in client components:
 *   if (!requireAuth(user, openLogin)) return;
 */
export function requireAuth(
  user: User | null,
  onUnauthenticated: () => void
): boolean {
  if (user) return true;
  onUnauthenticated();
  return false;
}
