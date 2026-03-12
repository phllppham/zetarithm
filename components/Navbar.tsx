"use client";

import { useAuthModal } from "@/contexts/AuthModalContext";
import { getDisplayName } from "@/lib/auth";

export default function Navbar() {
  const { user, openLogin } = useAuthModal();

  const { signOut } = useAuthModal();

  const displayName = user ? getDisplayName(user) : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-start justify-end px-4 sm:px-6 py-3 sm:py-4 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-4">
      {user ? (
        <div className="flex flex-col items-end gap-1">
          <span className="text-white/60 text-xs">{displayName}</span>
          <button
            onClick={signOut}
            className="text-white/30 text-xs hover:text-white/60 transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={openLogin}
          className="text-white/30 text-xs hover:text-white/60 transition-colors"
        >
          Login
        </button>
      )}
    </nav>
  );
}
