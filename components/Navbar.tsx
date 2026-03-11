"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
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
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end px-6 py-4">
      <div className="flex items-center gap-5 text-sm text-white/40">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-xs">{displayName}</span>
            <button
              onClick={handleSignOut}
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
