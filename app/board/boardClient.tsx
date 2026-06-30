"use client" //marks as a client component (runs only in server)

import { useState, useEffect, useRef } from "react"; // lets us remember things on screen (signed photo URLs)
import { createClient } from "@/utils/supabase/client"; //browser Supabase (Task 4)
import { deletePhoto, saveBackground, savePhoto, savePhotoPosition } from "./actions"; //our backend function 
import { StickerTray } from "./StickerTray";
import { DraggableSticker } from "./DraggableSticker";
import type { PlacedSticker } from "@prisma/client"; // Prisma generated this type when you ran `npx prisma generate`

//Describe the shape of one photo coiming form the database (Typescript safety):
type Photo = { id: string; path: string; frame: string; x: number; y: number};

//The three background choices (must match the filenames you put in public/background/);
const BACKGROUNDS = ["/backgrounds/bg1.png", "/backgrounds/bg2.png", "/backgrounds/bg3.png"];

// Delete a photo row — only if it belongs to the logged-in user.

export default function BoardClient({
    background, // the user's currently-chosen background
    photos, // the user's photos from the database
    userId, // the logged-in user's id (used to namespace their files)
    points, // the user's current points total
    placedStickers, // NEW: the user's placed stickers from the database
}: {
    background: string;
    photos: Photo[];
    userId: string;
    points: number;
    placedStickers: PlacedSticker[]; // NEW: an array of sticker rows
}) {
    const supabase = createClient(); //browser supabase client for uploading + signing URls

    //Remember a map of photoID -> a temporary viewable link for that private file:
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    
    const[positions, setPositions] = useState<Record<string, {x: number; y: number} >>(()=>{
        const initial: Record<string, {x: number; y: number}> = {};
            for (const p of photos){
                initial[p.id] = {x:p.x, y:p.y}; // start each photo where the database says it is 
            }
        return initial;
    });

    useEffect(() =>{
        setPositions((prev) => {
            const next = {...prev};
            for(const p of photos){
                if (!next[p.id]){
                    next[p.id] = {x: p.x, y: p.y}
                }
            }
            return next;
        });
    }, [photos]);

    //"ref" to track an in progress drag. we use a red (not state) vecause it changes many times per second as the mouse moves,
    //and we dont want to trigger a re-render on every tiny movement for the bookkeeping itself
    //it holds: which photo is being dragged, and the offset between the mouse 
    //and the polaroids top left corner (so the polaroid doesnt "jump" to the cursor when you grab it by middle)
    const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

    //Fetch a signed URL for every photo, AFTEr the page renders-
    //useEffect runs once after render (and again if `photos` changes)
    //this is the reliable place to do async work like asking supabase for links 
    useEffect(() => {
        //Fedine an async helper inside the effect (effects themselves can be async directly )
        async function loadUrls(){
            const updates: Record<string, string> = {} //collect new links here 

            //Loop over every photo and request a temporary signed link for each:
            for (const photo of photos){
                const {data} = await supabase.storage
                    .from("photos")                 //the private bucket
                    .createSignedUrl(photo.path, 60*60);  //valid for 1 hour 
                  if (data?.signedUrl){
                    updates[photo.id] = data.signedUrl; //stor eit under this photos id
                  }
            }
            setSignedUrls(updates); //save all the links at once, which re renders the polaroids
        }
        loadUrls(); // actually run it 
    }, [photos]); //re-run whenever the list of photos change 

    //when the user clicks a background thumbnail
    async function pickBackground(bg: string){
        await saveBackground(bg); //call the backend to save it (this also refreshed the page)
    }

    //When the user picks a file to upload 
    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];        // the file the user selected — get this FIRST
    if (!file) {
      console.log("No file selected");        // did we even get a file?
      return;
    }
    console.log("Got file:", file.name);      // confirm we have it

    // Check whether Supabase sees us as logged in, right before uploading:
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Session user id:", sessionData.session?.user?.id);  // should print your long user ID

    // Build the storage path ONCE (backticks required):
    const path = `${userId}/${Date.now()}-${file.name}`;
    console.log("Upload path:", path);        // compare its first folder to the id above

    // Upload the file to the private bucket:
    const { data, error } = await supabase.storage
      .from("photos")
      .upload(path, file);

    if (error) {
      console.error("UPLOAD ERROR:", error);  // the real reason, in the console
      alert("Upload failed: " + error.message);
      return;
    }

    console.log("Upload succeeded:", data);   // confirm Supabase accepted it

    // Now record it in the database:
    await savePhoto(path, "classic");
    console.log("savePhoto finished");        // confirm the DB save ran
  }

  //Drag Logic
  //1: mouse pressed Down on a polaroid -> start a drag 
    function handleMouseDown(e: React.MouseEvent, photoId: string){
        const current = positions[photoId]; //where this polaroid currently is 
        //Record which photo we grabbed, and how far the cursor is from its corner 
        //e.clientX/Y is the mouse positions on the page; current.y/y is the polaroid's 
        //corner . The different keeps the polaroid from snapping to the cursor 
        dragRef.current={
            id: photoId,
            offsetX: e.clientX - current.x,
            offsetY: e.clientY - current.y,
        };
    }
//2: mouse moves anywehre on the board -> if were dragging, move the polaroid 
    function handleMouseMove(e: React.MouseEvent){
        const drag = dragRef.current;
        if (!drag) return; //not dragging anything -> ignore 

        //New top-left corner = current mouse position minus the grab offset:
        const newX = e.clientX-drag.offsetX;
        const newY = e.clientY-drag.offsetY;

        //update just this photo's position in state, so it moves on screen:
        setPositions((prev) => ({
            ...prev,
            [drag.id]: {x: newX, y: newY},
        }));
    }
//3: mouse Released -> stop dragging and SAVE the final position to the DB
async function handleMouseUp(){
    const drag = dragRef.current;
    if (!drag) return; // werent dragging -> nothing to do 

    const finalPos = positions[drag.id]; //where it ended up
    dragRef.current = null; //clear the drag BEFORE the await 

    //Save to the database in the background. We dont reload the page;
    //the polaroid is already where the user dropped it
    await savePhotoPosition(drag.id, finalPos.x, finalPos.y);

}





    //Turn private file path into a temporary viewable link
    //private buckets dont have public URLs so we ask supabase for a short lived signed one
    async function getSignedUrl(photo: Photo){
        if (signedUrls[photo.id]) return; //already have one for this photo -> skip
        const {data} = await supabase.storage
            .from("photos") //the bucket 
            .createSignedUrl(photo.path, 60*60); // valid for 1 hour 
        if (data?.signedUrl){
            //save it so the <img> below can display it:
            setSignedUrls((prev) => ({...prev, [photo.id]: data.signedUrl}));
        }
    }


        return (
        //full-screen container; the chosen background fills it.
        //We attach mouse MOVE and UP here (on the whole board) so the drag keeps
        //working even if the cursor leaves the small polaroid while moving fast.
        <div
            onMouseMove={handleMouseMove}   // NEW: track movement across the whole board
            onMouseUp={handleMouseUp}       // NEW: finish the drag anywhere you release
            onMouseLeave={handleMouseUp}    // NEW: also finish if the mouse leaves the board
            style={{
                minHeight: "100vh",                       //fill the whole screen height
                backgroundImage: `url(${background})`,    //the user's chosen background
                backgroundSize: "cover",                  //scale it to cover the screen
                backgroundPosition: "center",             //center it
                padding: "1rem",                          //a little breathing room
                position: "relative",                     // NEW: makes this the anchor for absolutely-positioned polaroids
                overflow: "hidden",                       // NEW: hide anything dragged off the edge
            }}
        >
            {/* Points total (NEW) */}
            <div
                style={{
                    display: "inline-block",
                    background: "rgba(255,255,255,0.9)", // translucent white pill — reads on any background
                    color: "#0c4a6e",                    // sky-900 text
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // soft shadow so it lifts off the background
                    padding: "0.4rem 0.9rem",
                    borderRadius: 999,             //fully rounded pill
                    fontWeight: "bold",
                    marginBottom: "1rem",
                }}
            >
                ⭐ {points} points
            </div>

            {/* Background picker: three clickable thumbnails */}
            <StickerTray points={points} />
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {BACKGROUNDS.map((bg) => (
                    <img
                        key={bg}
                        src={bg}
                        onClick={() => pickBackground(bg)}
                        style={{
                            width: 80,
                            height: 50,
                            objectFit: "cover",
                            cursor: "pointer",
                            border: background === bg ? "3px solid #0ea5e9" : "1px solid #cbd5e1", // sky-500 when selected, slate-300 otherwise
                            borderRadius: 8,             // a bit more rounded

                        }}
                    />
                ))}
            </div>

            {/* Upload button (a styled file input) */}
            <label
                style={{
                    display: "inline-block",        //sit nicely inline
                    background: "#0ea5e9",          // sky-500 button
                    color: "white",                // white text on the blue
                    padding: "0.5rem 1rem",         //comfortable size (fixed: was "1 rem")
                    borderRadius: 6,                //rounded
                    cursor: "pointer",              //clickable
                    marginBottom: "1rem",           //space below
                }}
            >
                Upload photo
                <input
                    type="file"                      //a file picker
                    accept="image/*"                 //only allow images
                    onChange={handleUpload}          //run our upload handler when a file is chosen
                    style={{ display: "none" }}      //hide the ugly default input; the label is the button
                />
            </label>

            {/* The photos. Each one is now ABSOLUTELY positioned at its own x/y,
                and draggable. They are NO LONGER in a flex row. */}
            {photos.map((photo) => {
                // Where should this polaroid sit? Prefer our live `positions` map
                // (updates instantly while dragging); fall back to the DB value.
                const pos = positions[photo.id] ?? { x: photo.x, y: photo.y };

                return (
                    //the polaroid frame, now positioned freely and grabbable:
                    <div
                        key={photo.id}
                        onMouseDown={(e) => handleMouseDown(e, photo.id)} // NEW: grab to start dragging
                        onDoubleClick={async () => {                       // double-click to delete
                          await deletePhoto(photo.id);                    // server deletes it (checks it's yours)
                          window.location.reload();                       // refresh so it disappears
                        }}
                        style={{
                            position: "absolute",          // NEW: float anywhere on the board
                            left: pos.x,                   // NEW: horizontal position from x
                            top: pos.y,                    // NEW: vertical position from y
                            background: "white",           //the white polaroid card
                            padding: "10px 10px 30px",     //thin top/sides, thick bottom (classic Polaroid look)
                            boxShadow: "0 4px 10px rgba(0,0,0,0.3)", //soft shadow
                            borderRadius: 2,
                            cursor: "grab",                // NEW: show the grab hand so it's clearly draggable
                            userSelect: "none",            // NEW: don't highlight text while dragging
                        }}
                    >
                        {signedUrls[photo.id] ? (        //do we have a viewable link yet?
                            <img
                                src={signedUrls[photo.id]} //the temporary signed link to the private file
                                alt="polaroid"             //accessibility text
                                draggable={false}          // NEW: stop the browser's built-in image drag from fighting ours
                                style={{
                                    width: 200,              //fixed photo width
                                    height: 200,             //fixed photo height (square, like a polaroid)
                                    objectFit: "cover",      //crop to fill without distortion
                                    display: "block",        //remove tiny gap under the image
                                    pointerEvents: "none",   // NEW: clicks/drags pass through to the frame, not the img
                                }}
                            />
                        ) : (
                            //While the signed URL loads, show a placeholder so the layout doesn't jump:
                            <div style={{ width: 200, height: 200, background: "#eee" }} />
                        )}
                    </div>
                );
            })}

            {/* Placed stickers — same board surface as the polaroids, so they drag the same way */}
            {placedStickers.map((sticker) => (
                <DraggableSticker key={sticker.id} sticker={sticker} />
            ))}
        </div>
    );
}
