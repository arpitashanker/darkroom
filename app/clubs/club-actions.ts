"use server"; // marks every function here as SERVER-ONLY — runs on your machine, never in the user's browser. This is what keeps permission checks un-fakeable.

import { prisma } from "@/lib/prisma";            // your database client (same one your other actions use)
import { createClient } from "@/utils/supabase/server"; // Supabase server helper — note utils/ not lib/, matching your project
import { revalidatePath } from "next/cache";       // tells Next.js to refresh a page's data after a change

// ─────────────────────────────────────────────────────────────
// HELPER: who is logged in right now?
// We need the current user's Profile in BOTH actions, so we write it once.
// ─────────────────────────────────────────────────────────────
async function getMyProfile() {
  const supabase = await createClient();           // make a Supabase client tied to the current request
  const { data } = await supabase.auth.getUser();  // ask Supabase who's logged in (your pattern: data.user)

  if (!data.user) {                                // no logged-in user...
    throw new Error("Not logged in");              // ...stop right here, nobody anonymous gets through
  }

  // Find THIS user's Profile row by their email (Supabase user → your Profile table)
  const me = await prisma.profile.findUnique({
    where: { email: data.user.email! },            // the ! tells TypeScript "trust me, email exists"
  });

  if (!me) {                                       // logged in but somehow no Profile row...
    throw new Error("Profile not found");          // ...shouldn't happen, but we guard anyway
  }

  return me;                                        // hand back the full Profile (we'll use me.id)
}

// ─────────────────────────────────────────────────────────────
// ACTION 1: create a club. The creator automatically becomes curator.
// ─────────────────────────────────────────────────────────────
export async function createClub(formData: FormData) {
  const me = await getMyProfile();                 // figure out who's making the club

  const name = formData.get("name") as string;     // pull the club name out of the submitted form
  if (!name || name.trim() === "") {               // empty name?
    throw new Error("Club needs a name");          // refuse — a club must have a name
  }

  // Create the club AND its first membership together.
  // First the club, with me set as curator:
  const club = await prisma.club.create({
    data: {
      name: name.trim(),                           // store the cleaned-up name
      curatorId: me.id,                            // I am the curator (the boss)
    },
  });

  // Now add MYSELF as a member of my own club, with the "curator" role.
  // (Being curatorId on the club AND having a membership row keeps the member
  //  list complete — the curator shows up in it too.)
  await prisma.membership.create({
    data: {
      profileId: me.id,                            // this membership is for me
      clubId: club.id,                             // in the club I just made
      role: "curator",                             // my role here is curator
    },
  });

  revalidatePath("/clubs");                         // refresh the clubs list page so the new club shows up
  return club;                                      // hand the new club back to the page
}

// ─────────────────────────────────────────────────────────────
// ACTION 2: add a member by email. ONLY the curator of THIS club may do this.
// This is the heart of role-based access control.
// ─────────────────────────────────────────────────────────────
export async function addMember(clubId: string, email: string) {
  const me = await getMyProfile();                 // who is trying to add someone?

  // Look up the club so we can check who its curator is.
  const club = await prisma.club.findUnique({
    where: { id: clubId },                          // the club they're trying to add to
  });

  if (!club) {                                      // no such club?
    throw new Error("Club not found");
  }

  // ── THE PERMISSION CHECK ──
  // Is the person calling this actually the curator of this club?
  if (club.curatorId !== me.id) {                  // their id doesn't match the club's curator...
    throw new Error("Only the curator can add members"); // ...denied. A plain member hits this wall.
  }

  // Find the person they want to add, by the email they typed.
  const target = await prisma.profile.findUnique({
    where: { email: email.trim() },                // look up that email in your Profile table
  });

  if (!target) {                                    // nobody signed up with that email
    throw new Error("No user found with that email");
  }

  // Add them as a plain member.
  // We use the (profileId, clubId) unique rule from the schema to avoid duplicates:
  // upsert = "update if it already exists, otherwise create."
  await prisma.membership.upsert({
    where: {
      profileId_clubId: {                          // Prisma's name for your @@unique([profileId, clubId])
        profileId: target.id,
        clubId: club.id,
      },
    },
    update: {},                                     // already a member? do nothing (no error, no duplicate)
    create: {
      profileId: target.id,                        // add this person
      clubId: club.id,                              // to this club
      role: "member",                              // as a normal member (NOT curator)
    },
  });

  revalidatePath(`/clubs/${clubId}`);               // refresh that club's page so the new member appears
}