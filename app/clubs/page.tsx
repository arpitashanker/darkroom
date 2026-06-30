// No "use client" — this is a SERVER component. It fetches data and runs on your machine.
import { prisma } from "@/lib/prisma";                       // database client
import { createClient } from "@/utils/supabase/server";      // Supabase server helper (utils/, your pattern)
import { redirect } from "next/navigation";                  // to bounce logged-out visitors
import { createClub } from "./club-actions";                 // the action we wrote
import Link from "next/link";                                // Next's link for navigating to a club page

export default async function ClubsPage() {
  const supabase = await createClient();                     // make a Supabase client for this request
  const { data } = await supabase.auth.getUser();            // who's logged in? (your pattern: data.user)

  if (!data.user) {                                          // not logged in...
    redirect("/login");                                      // ...send them to login (protected route)
  }

  // Find this user's Profile by email (same link club-actions uses)
  const me = await prisma.profile.findUnique({
    where: { email: data.user.email! },
  });

  // Get every club this user belongs to, by reading their Membership rows
  // and pulling in the related club for each one.
  const myMemberships = await prisma.membership.findMany({
    where: { profileId: me!.id },                            // memberships that are mine
    include: { club: true },                                 // also fetch the club each membership points to
  });

  return (
  
    <div className="max-w-xl mx-auto my-10 p-5">
    {/* max-w-xl ≈ maxWidth:600 · mx-auto centers it · my-10 = 40px top/bottom margin · p-5 = 20px padding */}
      <h1 className="text-3xl font-bold text-blue-900 mb-5 font-serif">My Clubs</h1>
       {/* text-3xl ≈ fontSize:28 · font-bold · text-amber-900 = warm deep brown (cozier than black) · mb-5 = marginBottom:20 */}
      {/* CREATE A CLUB — a form that calls the createClub server action directly */}
      <form action={createClub} className = "mb-8 flex gap-2">
        {/* mb-8 ≈ marginBottom:30 · flex = display:flex · gap-2 = 8px between children */}
        <input
          name="name"                                        //{/* must be "name" — createClub reads formData.get("name") */}
          placeholder="New club name"
          className="flex-1 p-2 border border-slate-300 rounded md focus:border-blue-500 focus: outline-none"
        // flex-1 = grow to fill · p-2 = padding:8 · border + border-slate-300 = warm grey border ·
          // rounded-md = rounded · focus:border-blue-500 = border turns amber when typing (NEW, free polish) ·
          // focus:outline-none = removes the default blue glow
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover: bg-blue-700 transition-colors"
        // px-4 py-2 = padding · bg-amber-700 = warm brown button (cozier than #333) ·
          // hover:bg-amber-800 = darkens on hover · transition-colors = smooth fade (NEW polish)
        >
          Create
        </button>
      </form>

      {/* LIST OF CLUBS I'M IN */}
      {myMemberships.length === 0 ? (                         // no clubs yet?
        <p className="text-slate-500">You're not in any clubs yet. Create one above.</p>
         // text-slate-500 = soft warm grey (was #888)
      ) : (
        myMemberships.map((m) => (                            // one row per membership
          <Link
            key={m.id}
            href={`/clubs/${m.club.id}`}                      // go to that club's page
            className="block p-3.5 mb-2.5 border border-slate-200 rounded-lg no-underline text-slate-800 bg-blue-50 hover:bg-amber100 transition-colors"
            // block = display:block · p-3.5 ≈ padding:14 · mb-2.5 = marginBottom:10 ·
            // border-slate-200 = warm light border · rounded-lg = rounded · no-underline ·
            // text-slate-800 = warm dark text · bg-blue-50 = pale cream card (NEW — gives it warmth) ·
            // hover:bg-amber-100 = warms up on hover · transition-colors = smooth
          >
            <strong className="text-blue-900">{m.club.name}</strong>                    {/* the club's name */}
            <span className="text-slate-400 ml-2">
              ({m.role})                                      {/* your role: curator or member */}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}