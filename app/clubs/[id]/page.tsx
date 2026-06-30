import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { addMember } from "../club-actions";

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");
  }

  const me = await prisma.profile.findUnique({
    where: { email: data.user.email! },
  });

  const club = await prisma.club.findUnique({
    where: { id },
    include: { memberships: { include: { profile: true } } },
  });

  if (!club) {
    return <p className="p-10 text-slate-600">Club not found.</p>;
  }

  const amCurator = club.curatorId === me!.id;

  const myMembership = club.memberships.find((m) => m.profileId === me!.id);

  if (!amCurator && !myMembership) {
    return <p className="p-10 text-slate-600">You don&apos;t have access to this club.</p>;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-xl mx-auto py-10 px-5">

        {/* ← Home link, back to the dashboard */}
        <Link href="/" className="text-sky-600 hover:text-sky-700 no-underline text-sm">
          ← Home
        </Link>

        <h1 className="text-3xl font-bold text-sky-900 font-serif mt-4">{club.name}</h1>
        <p className="text-slate-400 mb-6">
          {amCurator ? "You are the curator" : "You are a member"}
        </p>

        {/* MEMBER LIST */}
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Members</h2>
        {club.memberships.map((m) => (
          <div
            key={m.id}
            className="flex justify-between items-center p-3 bg-sky-50 rounded-lg mb-2 border border-slate-200"
          >
            <span className="text-slate-800">
              {m.profile.email}
              <span className="text-slate-400 ml-2">({m.role})</span>
            </span>

            {amCurator && m.profileId !== me!.id && (
              <Link
                href={`/clubs/${id}/member/${m.profileId}`}
                className="text-sky-600 hover:text-sky-700 underline text-sm"
              >
                View board
              </Link>
            )}
          </div>
        ))}

        {/* ADD MEMBER — curator only */}
        {amCurator && (
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              await addMember(id, email);
            }}
            className="mt-6 flex gap-2"
          >
            <input
              name="email"
              placeholder="Add member by email"
              className="flex-1 p-2 border border-slate-300 rounded-md focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
            >
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
