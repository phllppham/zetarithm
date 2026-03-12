"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import LoginModal from "@/components/LoginModal";
import { subscribeToAuth, signOut as authSignOut, requireAuth as checkAuth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface AuthContextType {
  // ── Auth state ────────────────────────────────────────────────────────────
  /** Currently authenticated user. null while loading or signed out. */
  user: User | null;
  /** Current Supabase session (contains JWT used for all queries). null if not signed in. */
  session: Session | null;
  /** True while the initial session check is in progress. */
  loadingAuth: boolean;

  // ── Helpers ───────────────────────────────────────────────────────────────
  /**
   * Signs the user out and clears the session.
   * Redirects to "/" after sign-out.
   */
  signOut: () => Promise<void>;
  /**
   * If authenticated, returns true immediately.
   * If not, opens the login modal and returns false.
   * Use before any protected action: `if (!requireAuth()) return;`
   */
  requireAuth: () => boolean;

  // ── Login modal ───────────────────────────────────────────────────────────
  openLogin: () => void;
  closeLogin: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loadingAuth: true,
  signOut: async () => {},
  requireAuth: () => false,
  openLogin: () => {},
  closeLogin: () => {},
});

export function useAuthModal(): AuthContextType {
  return useContext(AuthContext);
}

// Convenience alias for consumers that care only about auth (not the modal)
export { useAuthModal as useAuth };

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  // Subscribe to auth changes on mount — uses getSession() for the first
  // snapshot (fast) then onAuthStateChange for every subsequent update.
  useEffect(() => {
    const unsubscribe = subscribeToAuth((u, s) => {
      setUser(u);
      setSession(s);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = useCallback(async () => {
    await authSignOut();
    // Hard-redirect so all in-memory state (game, scores) resets cleanly
    window.location.href = "/";
  }, []);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const requireAuthFn = useCallback((): boolean => {
    return checkAuth(user, openLogin);
  }, [user, openLogin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loadingAuth,
        signOut: handleSignOut,
        requireAuth: requireAuthFn,
        openLogin,
        closeLogin,
      }}
    >
      {children}
      {loginOpen && <LoginModal onClose={closeLogin} />}
    </AuthContext.Provider>
  );
}
