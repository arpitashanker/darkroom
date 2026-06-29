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
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>My Clubs</h1>

      {/* CREATE A CLUB — a form that calls the createClub server action directly */}
      <form action={createClub} style={{ marginBottom: 30, display: "flex", gap: 8 }}>
        <input
          name="name"                                        //{/* must be "name" — createClub reads formData.get("name") */}
          placeholder="New club name"
          style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button
          type="submit"
          style={{ padding: "8px 16px", background: "#333", color: "white", borderRadius: 6 }}
        >
          Create
        </button>
      </form>

      {/* LIST OF CLUBS I'M IN */}
      {myMemberships.length === 0 ? (                         // no clubs yet?
        <p style={{ color: "#888" }}>You're not in any clubs yet. Create one above.</p>
      ) : (
        myMemberships.map((m) => (                            // one row per membership
          <Link
            key={m.id}
            href={`/clubs/${m.club.id}`}                      // go to that club's page
            style={{
              display: "block",
              padding: 14,
              marginBottom: 10,
              border: "1px solid #eee",
              borderRadius: 8,
              textDecoration: "none",
              color: "#222",
            }}
          >
            <strong>{m.club.name}</strong>                    {/* the club's name */}
            <span style={{ color: "#999", marginLeft: 8 }}>
              ({m.role})                                      {/* your role: curator or member */}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}