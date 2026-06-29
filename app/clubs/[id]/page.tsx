import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { addMember } from "../club-actions";                 // ../ because we're one folder deeper now

// The page receives { params } — params.id is the club id from the URL /clubs/SOMEID
export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;                               // in Next 15, params is a promise — await it

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");                                      // protected
  }

  const me = await prisma.profile.findUnique({
    where: { email: data.user.email! },
  });

  // Load the club, AND its memberships, AND each member's profile (for their email).
  const club = await prisma.club.findUnique({
    where: { id },                                           // this club, from the URL
    include: {
      memberships: {                                         // its member records...
        include: { profile: true },                         // ...and the Profile behind each one
      },
    },
  });

  if (!club) {                                               // bad URL / deleted club
    return <p style={{ padding: 40 }}>Club not found.</p>;
  }

  // Is the person viewing this page the curator? Controls what they can see/do.
  const amCurator = club.curatorId === me!.id;               // true only for the boss

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 28 }}>{club.name}</h1>
      <p style={{ color: "#999", marginBottom: 24 }}>
        {amCurator ? "You are the curator" : "You are a member"}  {/* shows your status */}
      </p>

      {/* MEMBER LIST — everyone sees this */}
      <h2 style={{ fontSize: 20, marginBottom: 10 }}>Members</h2>
      {club.memberships.map((m) => (                          // one row per member
        <div
          key={m.id}
          style={{ padding: 10, borderBottom: "1px solid #eee" }}
        >
          {m.profile.email}                                  {/* the member's email */}
          <span style={{ color: "#999", marginLeft: 8 }}>
            ({m.role})                                        {/* curator or member */}
          </span>
        </div>
      ))}

      {/* ADD MEMBER — ONLY the curator sees this whole block.
          A plain member never even gets the form rendered.
          (And even if they forced the action, addMember re-checks on the server.) */}
      {amCurator && (
        <form
          action={async (formData: FormData) => {            // inline server action wrapper
            "use server";                                    // this little function runs on the server
            const email = formData.get("email") as string;  // read the typed email
            await addMember(id, email);                      // call our action with this club + that email
          }}
          style={{ marginTop: 24, display: "flex", gap: 8 }}
        >
          <input
            name="email"                                    //{/* matches formData.get("email") */}
            placeholder="Add member by email"
            style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
          <button
            type="submit"
            style={{ padding: "8px 16px", background: "#333", color: "white", borderRadius: 6 }}
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}