import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'

export async function updateSession(request: NextRequest){
    //start with a response that just passes the request through unchanged.
    let supabaseResponse = NextResponse.next({request})


//Build a server client, but here cookies live on the REQUEST/RESPONSE, not next/headers
//COPY AND PAST FROM supabase docs -> how to set up next.js
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        {
            cookies: {
                getAll() {
                    //read cookies off the incoming request
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet){
                    //write refreshed cookies onto botht he request and the outgoing response
                    cookiesToSet.forEach(({ name, value, options}) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options}) => 
                    supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        },
    )
        //Important: getUser() forces a token refresh if needed. Dont remove this line. 
    // It revalidates the session on every request so logins dont go stale.
    await supabase.auth.getUser()

    //hand the (possibly cookie-updates) response back to Next.js
    return supabaseResponse 
}

