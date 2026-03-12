import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || user?.user_metadata?.user_name
    || user?.email?.split("@")[0]
    || null;

  return (
    <div className="flex h-screen items-center justify-center px-4 overflow-hidden">
      <GlassCard className="w-full max-w-sm px-8 py-10">
        <div className="flex items-start justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors pt-1">
            ← Back
          </Link>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/4 px-5 py-4">
              <p className="text-white/35 text-xs mb-1">Username</p>
              <p className="text-white font-medium">{displayName}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/4 px-5 py-4">
              <p className="text-white/35 text-xs mb-1">Email</p>
              <p className="text-white/70 text-sm">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm mb-5">Sign in to view your profile and statistics.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all"
            >
              Login
            </Link>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
