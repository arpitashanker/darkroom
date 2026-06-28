import { createServerClient } from '@supabase/ssr' //import the helper that builds a server Supabase client 
import { NextResponse, type NextRequest } from 'next/server'//import the Next.js request and response types for middleware 

//Next.js automaticallyruns this function on every request that matches the config 
export async function proxy(request: NextRequest){
    //Start with a response that just passes the request through, unchanged
    let supabaseResponse = NextResponse.next({
        request
    });

    //build a serve client, but here cookies live on the REQUEST/RESPONSE, not next/headers.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            //tell supabase how to read and write cookie sin middleware
            cookies: {
                //Read: hand supabase cookies off the incoming request
                getAll(){
                    return request.cookies.getAll() 
                    //returns all cookies from the incoming request 
                },
                //Write refreshed cookies onto BOTH the request and the outgoing response 
                setAll(cookiesToSet){
                    //first, write each cookie onto the request object (so the rest of this request sees them)
                    cookiesToSet.forEach(({name, value}) => 
                    request.cookies.set(name, value)
                )
                supabaseResponse = NextResponse.next({
                    //Use the now updates request 
                    request,
                });
                //then write each cookie onto the RESPONSE (so browser stores the refreshed token)
                cookiesToSet.forEach(({name, value, options}) => 
                    supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
//IMPORTANT: this call refreshed the auth token if its expired 
//Calling getUser() here is what actually triggers the cookie refresh above 
  await supabase.auth.getUser();

  //return the response (with any refreshed cookies attached)
  return supabaseResponse;
}

//Config object that tells Next.js WHICH routes this middleware should run on 
export const config = {
    //the matcher uses reges to run on all paths EXCEPT static files and images 
    matcher: [
        //Match everything except: _next/static, _next/image, favicon, and common image file types 
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|heic|jpeg|gif|webp)$).*)",
    ],
};