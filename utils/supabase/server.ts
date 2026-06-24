//this will run on server side, it needs acces to the cookies to read th elogged in session
import {createServerClient} from '@supabase/ssr'
//next/headers gives server code acces to the request's cookies
import {cookies} from 'next/headers'

//async because reading cookies on the server is an asynch operation 
//async func (specialized func) that allows code to perform long-ruuning tasks
//such as fetching data from external API, reading files w out blocking the rest of the web 
// or loading images from a server 
export async function createClient(){ 
    //Grab the cookie store for the current request
    const cookieStore = await cookies() 
    //await temp pauses the execution of an async function until a specific task finishes 

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            //supabase needs to read AND write auth cookies. We hand it functions to do that.
            cookies: {
                //getAll: lets supabase read every cookie (to find the session)
                getAll(){ 
                    return cookieStore.getAll()
                    //hands back every cookie current on the request
                },
                //setAll : lets Supabase save refreshed session cookies back to the browser
                setAll(cookiesToSet){
                    try{
                        cookiesToSet.forEach(({name, value, options}) => //loops through each cookie supabase wants to set 
                            cookieStore.set(name, value, options)//write it into the next.js cookie store 
                        )
                    } catch{
                        //this can fail when called from a server component (read-only context)
                        //its safe to ignore if you have middleware refreshing the session 
                    }
                }
            }

        },
    )
}