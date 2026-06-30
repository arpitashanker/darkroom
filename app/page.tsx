// Your home page / dashboard — a SERVER component (no "use client").
// It fetches your stats on the server, then shows them with navigation.
import { prisma } from "@/lib/prisma";                  // database client
import { createClient } from "@/utils/supabase/server"; // Supabase server helper
import { redirect } from "next/navigation";             // bounce logged-out visitors
import Link from "next/link";                            // for navigation buttons

export default async function Home() {
  // ── WHO'S LOGGED IN? (same pattern as your other pages) ──
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");                                  // not logged in → login page
  }

  // Find this user's Profile (holds their points)
  const me = await prisma.profile.findUnique({
    where: { email: data.user.email! },
  });

  // ── FETCH THE THREE STATS ──
  // count() asks the database "how many rows match?" — more efficient than
  // fetching all the rows and counting them in JavaScript.
  const photoCount = await prisma.photo.count({
    where: { profileId: me!.id },                        // how many photos are mine?
  });

  const clubCount = await prisma.membership.count({
    where: { profileId: me!.id },                        // how many clubs am I in?
  });

  const points = me?.points ?? 0;                        // my points (already on Profile)

  return (
    // Full-height white page, centered content
    <div className="min-h-screen w-full bg-white flex flex-col items-center py-16 px-6">
      <div className="w-full max-w-3xl">

        {/* GREETING — big serif headline for that polished look */}
        <h1 className="text-4xl font-bold text-sky-900 font-serif mb-2">
          Welcome back
        </h1>
        <p className="text-slate-500 mb-10">
          {me?.email}                                    {/* shows your email */}
        </p>

        {/* STAT CARDS — three numbers side by side */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {/* grid-cols-3 = three equal columns · gap-4 = space between them */}

          {/* Points card */}
          <div className="bg-sky-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-sky-700">{points}</div>
            <div className="text-sm text-slate-500 mt-1">Points</div>
          </div>

          {/* Photos card */}
          <div className="bg-sky-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-sky-700">{photoCount}</div>
            <div className="text-sm text-slate-500 mt-1">Photos</div>
          </div>

          {/* Clubs card */}
          <div className="bg-sky-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-sky-700">{clubCount}</div>
            <div className="text-sm text-slate-500 mt-1">Clubs</div>
          </div>
        </div>

        {/* NAVIGATION BUTTONS — big links to the two main features */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* stacked on mobile, side-by-side (sm:flex-row) on wider screens */}

          <Link
            href="/board"
            className="flex-1 bg-sky-500 text-white text-center py-4 rounded-xl text-lg font-medium hover:bg-sky-600 transition-colors no-underline"
          >
            My Board →
          </Link>

          <Link
            href="/clubs"
            className="flex-1 border border-sky-200 text-sky-700 text-center py-4 rounded-xl text-lg font-medium hover:bg-sky-50 transition-colors no-underline"
          >
            My Clubs →
          </Link>
        </div>

      </div>
    </div>
  );
}
