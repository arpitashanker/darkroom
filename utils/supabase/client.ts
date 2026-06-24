import { createBrowserClient } from '@supabase/ssr' 
//runs in the user's broswer, so we use the browser-specific helper 

//a function that builds and returns a supabase client configured for the browser
export function createClient(){
    //createBrowserClient reads the env vars (keeps passwords, etc) and wires up cookie handling automatically 
    return createBrowserClient(
        //the "!" tells TypeScript "this value exists" (Its in the .env)
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
}