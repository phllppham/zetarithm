"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Defer Supabase client creation to client-side only
    import("@/lib/supabaseClient").then(({ createClient }) => {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => setUser(data.user));

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => listener.subscription.unsubscribe();
    });
  }, []);

  const handleSignOut = async () => {
    const { createClient } = await import("@/lib/supabaseClient");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name ||
    user?.email?.split("@")[0] ||
    null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      <Link href="/" className="text-white/90 font-bold text-lg tracking-tight hover:text-white transition-colors">
        ZetaMath
      </Link>

      <div className="flex items-center gap-6 text-sm text-white/60">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <Link href="/leaderboard" className="hover:text-white transition-colors">
          Leaderboard
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-white/80 font-medium">{displayName}</span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
