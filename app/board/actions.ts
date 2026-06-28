"use server"; // marks every function in tis file as backend only (runs on the server)

import {PrismaClient} from "@prisma/client"; //your database client
import {createServerClient} from "@supabase/ssr" //Supabase client for the server 
import {cookies} from "next/headers"; //lets the server read the logged-in user's cookies 
import {revalidatePath} from "next/cache";
import { createClient } from "@/utils/supabase/server";
//import BoardClient from "./boardClient";


const prisma = new PrismaClient(); // create one Prisma instance to run queries 

//A small helper that fugures out who is logged in, on the server
async function getUser(){
    const cookieStore = await cookies(); // grab the requests cookies (holds the session)
    //Build a server-side Supabase client that can read the session from those cookies:
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, //project URL
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, //we dont need to set cookies in this action, so no-op
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll:() => {}, 
          },
        }
    );
    const {data} = await supabase.auth.getUser(); //ask Supabase: who is this?
    return data.user; //returns the logged -in user (or null if nobody)
}

//Action 1: save which background the user picked
export async function saveBackground(background: string) {
  const user = await getUser();                 // who's calling?
  if (!user) throw new Error("Not logged in");  // block anyone not signed in

  // upsert = "update if the row exists, otherwise create it."
  // This fixes accounts that never got a Profile row, and is safe for everyone.
  await prisma.profile.upsert({
    where: { id: user.id },          // look for a Profile whose id matches the logged-in user
    update: { background },          // IF found: just change the background column
    create: {                        // IF NOT found: make a new Profile row for them
      id: user.id,                   // use the auth user's id as the Profile id (they must match)
      email: user.email ?? "",       // fill in their email (?? "" guards against it being null)
      background,                    // set their chosen background
    },
  });

  revalidatePath("/board"); // refresh the board so the new background shows
}  

//Action 2: record an uploaded photo in the database
//the actual file upload happpends in the browser (here wher just save its path)
export async function savePhoto(path: string, frame: string){
    const user = await getUser(); //who is calling 
    if(!user) throw new Error("Not logged in"); //blocks anyone not signed in

    //Create a new photo row linked to this user 
    await prisma.photo.create({
        data: {
            path,                   //where the file live in the storage bucket
            frame,                  //which polaroid style 
            profileId: user.id,     //attach it to the logged-in user 
        },
    });
    //Award 10 points for the upload. This happens on the SERVER, so a user cant
    //fake points by editing the page in their browser
    //`increment` tells Prisma "add to whatever the current value is"-safe
    //even if two upload happen close together
    await prisma.profile.update({
        where: {id:user.id}, //this users Profile row 
        data: {points: {increment:10}} //points = points+10
    })
    revalidatePath("/board"); //refresh so the new photo appears on the board 
}
//Action 3: save a photo's new position after the user drags and drops it 
export async function savePhotoPosition(photoId: string, x: number, y: number){
    const user = await getUser(); // who is calling 
    if (!user) throw new Error("Not logged in"); // error for anyone not signed in 
    //Update this photo's x/y but only if it belongs to this user 
    //Using `updateMany` with profileId in the filter means someone cant 
    //move another person's photo by guessing its id. If the photo isnt 
    //theirs, zero row match and nothing can change 
    await prisma.photo.updateMany({
        where: {
            id: photoId,  // the photo they dragged 
            profileId: user.id,   //...and it must be theirs 
        },
        data: {
            x: Math.round(x), //round to whole number (column is in int)
            y: Math.round(y) //round to whole number (column is in int)
        },
    });
    //Note: no revalidate Path here on purpose because the page shouldnt reload eveyrtime you drop a photo 
    //the browser already shows it in the new spots, so it should just quietly save 
}