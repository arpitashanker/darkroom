"use client" //marks as a backend component (runs only in server)

import { useState, useEffect } from "react"; // lets us remember things on screen (signed photo URLs)
import { createClient } from "@/utils/supabase/client"; //browser Supabase (Task 4)
import { saveBackground, savePhoto } from "./actions"; //our backend function 

//Describe the shape of one photo coiming form the database (Typescript safety):
type Photo = { id: string; path: string; frame: string; x: number; y: number};

//The three background choices (must match the filenames you put in public/background/);
const BACKGROUNDS = ["/backgrounds/bg1.png", "/backgrounds/bg2.png", "/backgrounds/bg3.png"];

export default function BoardClient({
    background, // the user's currently-chgosen background 
    photos, // the user's photos from the database 
    userId, // the logged-in user's id (used to namespace their files)
}: {
    background: string;
    photos: Photo[];
    userId: string;
}) {
    const supabase = createClient(); //browser supabase client for uploading + signing URls

    //Remember a map of photoID -> a temporary viewable link for that private file:
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

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

    return(
        //full-screen container; the chosen background fills it:
        <div
          style={{
            minHeight: "100vh",                         //fill the whole screen height 
            backgroundImage: `url(${background})`,      //the user's chosen background 
            backgroundSize: "cover",                    //scale it to cover the screen 
            backgroundPosition: "center",               //center it 
            padding: "1rem",                            //a little breathing room
          }}
          >
            {/* Background picker: three clickable thumbnails */}
            <div style={{display: "flex", gap: "0.5rem", marginBottom: "1rem"}}>
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
                        border: background === bg ? "3px solid white" : "1px solid gray",
                        borderRadius: 4,
                      }}
                      />
                ))}
          </div>
          {/* Upload button (a styled file input)*/}
          <label
            style={{
                display: "inline-block",        //sit nicely inline
                background: "grey",            //white button
                padding: ".5rem 1 rem",        //comfortable size
                borderRadius: 6,                //rounded
                cursor: "pointer",              //clickable
                marginBottom: "4rem",            //space below
                
            }}
          >
            Upload photo 
            <input
               type="file"                      //a file picker 
               accept="image/*"                 //only allow images
               onChange={handleUpload}          //run our upload handler when a file is chosen
               style={{ display: "none"}}       //hide the ugly default input; the label is the button 
            />
            </label>
            {/* the photos, each in a polaroid frame*/}
            <div style={{display:"flex", flexWrap:"wrap", gap:"1rem" }}>
               {photos.map((photo) => {
                //Ask for a signed URL the first time we render this photo
                if(!signedUrls[photo.id]) getSignedUrl(photo);

                return(
                    //the polaroid frame: white box, thick bottom edge, soft shadow -- pure CSS, no PNG needed 
                    <div
                      key={photo.id}            //unique key per photo
                      style={{
                        background: "white",    //the white polaroid card
                        padding: "10px 10px 30px", //thin top/sides, thick bottom (classic Polaroid look)
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)", //slight corner softening 
                        borderRadius: 2,
                      }}
                    >
                        {signedUrls[photo.id] ? (        //do we have a viewable link yet?
                            <img
                              src={signedUrls[photo.id]} //the temporary signed link to the private file
                              alt="polaroid"             //accessibility text
                              style={{
                                width: 200,              //fixed photo width
                                height: 200,             //fixed photo height (square, like a polaroid)
                                objectFit: "cover",      //crop to fill without distortion
                                display: "block"         //remove tiny gap under the image
                              }}
                            />
                        ):(
                            //While the signed URL loads, show a placeholder so the layout doesn't jump
                            <div style={{ width: 200, height: 200, background: "#eee"}} />
                        )
                        }
                    </div>
                );
               })} 
            </div>
        </div>
    );
}