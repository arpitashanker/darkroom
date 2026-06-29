// This is a SERVER component. It runs on the server, reads the database,
// then sends ready-made HTML to the browser.

import { PrismaClient } from "@prisma/client";        // database client
import { createServerClient } from "@supabase/ssr";   // server-side Supabase
import { cookies } from "next/headers";               // read the session cookie
import { redirect } from "next/navigation";           // bounce logged-out users
import  BoardClient   from "./boardClient";  
import { StickerTray } from "./StickerTray";
import { DraggableSticker } from "./DraggableSticker";            // the interactive part (Task 6b)
import Link from "next/link";  // Next's link component for navigating between pages

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
    if (!data.user) redirect("/login");         // not logged in → send to login (your protected route)

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

  //already fetch the profile and photos. add the stickers:
  const placedStickers = await prisma.placedSticker.findMany({
    where: { profileId: data.user.id },
  });
  //The in the jsx, alongside you <StickerTray /> and polaroids:
  //<StickerTrap points={profile.points} />
  // {{placedSticker.map((s) => DraggableSticker key={s.id} sticker={s} />)}}
  {/* Link to the clubs page */}

return (
    // A fragment <> lets us return the link AND the board side by side
    <>
      {/* Clubs link — sits on top of the board */}
      <Link
        href="/clubs"
        style={{
          position: "fixed",        // pin it so it floats above the board
          top: 16,                  // 16px from the top
          right: 16,                // 16px from the right
          zIndex: 50,               // sit above the board surface
          padding: "6px 12px",
          background: "#333",
          color: "white",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        Clubs
      </Link>
    
  
  
  <BoardClient //Hand the data to the interactive client component:
    background={profile?.background ?? "/backgrounds/bg1.png"}
    photos={photos}
    userId={data.user.id}
    points={profile?.points ?? 0}
    placedStickers={placedStickers}  // NEW — hand the stickers to the client too
  />
  </>
  
);
  
}
