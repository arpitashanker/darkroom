// SERVER component — reads the database, signs photo URLs, sends ready-made HTML.
import { PrismaClient } from "@prisma/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

const prisma = new PrismaClient(); // one Prisma instance for queries

// URL is /clubs/[id]/member/[memberId] — params has BOTH ids.
export default async function MemberBoardPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const { id, memberId } = await params; // id = club id, memberId = whose board

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data } = await supabase.auth.getUser(); // who is viewing?
  if (!data.user) redirect("/login");

  // ── GUARD: only the CURATOR of THIS club may view a member's board ──
  const club = await prisma.club.findUnique({
    where: { id },
    include: { memberships: true },
  });

  if (!club) {
    return <p style={{ padding: 40 }}>Club not found.</p>;
  }

  if (club.curatorId !== data.user.id) {
    return <p style={{ padding: 40 }}>Only the curator can view members&apos; boards.</p>;
  }

  const targetIsMember = club.memberships.some(
    (m) => m.profileId === memberId
  );

  if (!targetIsMember) {
    return <p style={{ padding: 40 }}>That person is not a member of this club.</p>;
  }

  // ── PASSED — load the member's board data (read-only) ──
  const member = await prisma.profile.findUnique({
    where: { id: memberId },
  });

  const photos = await prisma.photo.findMany({
    where: { profileId: memberId },
    orderBy: { createdAt: "asc" },
  });

  const placedStickers = await prisma.placedSticker.findMany({
    where: { profileId: memberId },
  });

  const background = member?.background ?? "/backgrounds/bg1.png";

  // ── SIGN each photo's URL on the server (the bucket is private) ──
  // Build a map of photo.id -> signed URL, same as your board does, but here.
  const signedUrls: Record<string, string> = {};
  for (const photo of photos) {                         // loop every photo
    const { data: signed } = await supabase.storage
      .from("photos")                                   // the private bucket
      .createSignedUrl(photo.path, 60 * 60);            // valid for 1 hour
    if (signed?.signedUrl) {                            // if signing worked...
      signedUrls[photo.id] = signed.signedUrl;          // store the viewable link
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        overflow: "hidden",
      }}
    >
      <Link
        href={`/clubs/${id}`}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 50,
          padding: "6px 12px",
          background: "#333",
          color: "white",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        ← Back to club
      </Link>

      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 50,
          padding: "6px 12px",
          background: "rgba(0,0,0,0.6)",
          color: "white",
          borderRadius: 6,
        }}
      >
        {member?.email}&apos;s board (read-only)
      </div>

      {photos.map((photo) => (
        <img
          key={photo.id}
          src={signedUrls[photo.id]}                    // the signed, viewable link
          alt=""
          style={{
            position: "absolute",
            left: photo.x,
            top: photo.y,
            width: 200,
            border: "8px solid white",
            borderBottom: "32px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        />
      ))}

      {placedStickers.map((sticker) => (
        <img
          key={sticker.id}
          src={`/stickers/${sticker.stickerKey}.png`}
          alt=""
          style={{
            position: "absolute",
            left: sticker.x,
            top: sticker.y,
            width: 80,
          }}
        />
      ))}
    </div>
  );
}
