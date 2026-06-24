//Import Next.js's server side redirect function 
import { redirect } from "next/navigation";
//Import our SERVER Supabase client from Step 3
import { createClient } from "@/utils/supabase/server";

//Server component (no "use client") so the auth check runs before any HTML is sent 
export default async function BoardPage(){
    //Build a server Supabase client wired to the request's cookies 
    const supabase = await createClient();

    //Ask supabase who the logged-in user is (reads the sessioin cookie) 
    const{
        //Pull the user object out of the response 
        data: { user },
    } = await supabase.auth.getUser();

    //If there's no user, the visitor isn't logged in - send them to /login 
    if(!user){
        //redirect() stops rendering and bounces them away 
        redirect("/login");
    }

    //if we got here, the user IS logged in - render the board 
    return(
        //Full -screen container  (your backgrounds go here on Day 4)
        <div className= "min-h0screen p-8">
            {/* Great the logged-in user bvy email*/}
            <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
            {/* Placeholder until Day 4 build sthe rela board */}
            <p className="mt-2 text-gray-600"> Your board will live here.</p>
        </div>
    );
}
