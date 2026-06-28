"use server"; //Everything here runs only on the serve. The Broswer canot fake it 

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma"; //existing prisma client 
import { createClient } from "@/utils/supabase/server"; //existing server-side supabase helper 
import { getSticker } from "@/lib/stickers";

//Unlock ( buy) a sticker and place it on the board 
//Called from a button in the tray. The broswer passes ONLy the sticker key 

// Delete a placed sticker — only if it belongs to the logged-in user.
export async function deleteSticker(stickerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  // The profileId check means User A can never delete User B's sticker.
  await prisma.placedSticker.deleteMany({
    where: { id: stickerId, profileId: user.id },
  });

  revalidatePath("/board");
}
export async function unlockSticker(stickerKey: string){
    //1. who is asking? get the logged in user from supabase (server-side, trusted)
    const supabase = await createClient();
    const{data: { user } } = await supabase.auth.getUser();
    if (!user){
        throw new Error("Not logged in") //no user = no purchase 
    }
    //2. look up the REAL const on the server. We ignore any rpice the browser send.
    const sticker = getSticker(stickerKey);
    if(!sticker){
        throw new Error("Unkown Sticker"); //someone sent a fake key 
    }
    //3. Get the user's current points from the database (the source of truth)
    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { points: true},
    });
    if(!profile){
        throw new Error("Profile not found");
    }
    //4. Can they afford it? If not, stop here - no points removed, o sticker placed.
    if (profile.points < sticker.cost){
        throw new Error("Not enough points");
    }
    //5. Charge the points AND place the sticker together
    //A transaction means BOTH happen. or EITHEr does- never one or other 
    await prisma.$transaction([
        //a. subtract the cost from the usser's points 
        prisma.profile.update({
            where: { id: user.id },
            data: { points: {decrement: sticker.cost} },
        }),
        //b. create the placed sticker at a default spot (they'll drag it after)
        prisma.placedSticker.create({
            data:{
                stickerKey: sticker.key,
                profileId: user.id,
                x:100,
                y:100,
            },
        }),
    ]);
    //6. tell Next.js the board changed so it re-renders with the new sticker + new point toal
    revalidatePath("/board");
}


// Delete a photo row — only if it belongs to the logged-in user.
export async function deletePhoto(photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  await prisma.photo.deleteMany({
    where: { id: photoId, profileId: user.id },
  });

  revalidatePath("/board");
}

//Save a sticker's new position after the user drags it (same idea as polaroids).
export async function moveSticker(stickerId: string, x: number, y: number){
    const supabase = await createClient();
    const { data: {user } } = await supabase.auth.getUser();
    if (!user){
        throw new Error("Not logged in");
    }

    //Security: only update the sticker if it BELONGS to this user 
    //The `profileId: user.id` in the where-clause means User A can never move User B's sticker
    await prisma.placedSticker.updateMany({
        where: { id: stickerId, profileId: user.id },
        data: { x, y },
    });
    revalidatePath("/board")

    // Delete a placed sticker — only if it belongs to the logged-in user.

}