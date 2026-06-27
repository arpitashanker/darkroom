// This is a SERVER component. It runs on the server, reads the database,
// then sends ready-made HTML to the browser.

import { PrismaClient } from "@prisma/client";        // database client
import { createServerClient } from "@supabase/ssr";   // server-side Supabase
import { cookies } from "next/headers";               // read the session cookie
import { redirect } from "next/navigation";           // bounce logged-out users
import BoardClient from "./boardClient";              // the interactive part (Task 6b)

const prisma = new PrismaClient(); // one Prisma instance for queries

export default async function BoardPage() {
  const cookieStore = await cookies(); // get cookies from the incoming request

  // Build a server Supabase client to find out who's logged in:
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(), // give Supabase the cookies
        setAll: () => {},                   // no cookie-setting needed here
      },
    }
  );

  const { data } = await supabase.auth.getUser(); // who is this?
  if (!data.user) redirect("/login");             // not logged in → send to login (your protected route)

  // Load this user's Profile (so we know their chosen background):
  // Load this user's Profile — and create one if it doesn't exist yet:
  let profile = await prisma.profile.findUnique({
    where: { id: data.user.id }, // match the logged-in user's id
  });

  // If this user has no Profile row yet, make one with default values:
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        id: data.user.id,      // link it to the logged-in user
        email: data.user.email!, // their email (! = "I promise this exists")
        // points and background fall back to their schema defaults
      },
    });
  }

  // Load all of this user's photos to show on the board:
  const photos = await prisma.photo.findMany({
    where: { profileId: data.user.id }, // only THIS user's photos
    orderBy: { createdAt: "asc" },      // oldest first (stable order)
  });
  
  // Hand the data to the interactive client component:
  return (
    <BoardClient
      background={profile?.background ?? "/backgrounds/bg1.png"} // chosen bg, or a default
      photos={photos}      // the user's photos
      userId={data.user.id} // needed to build the upload file path
      points={profile?.points ?? 0} //their current points total 
    />
  );
}
