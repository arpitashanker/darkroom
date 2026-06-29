//Next.js types for reading the incoming request 
import {NextRequest, NextResponse} from "next/server";
//Your Prisma client (assumes you have lib/prisma.ts )
import {prisma} from "@/lib/prisma";

//Next.js calls this function automatically for POST requests to /api/profile 
export async function POST(request: NextRequest){
    //Read and parse the JSON body the signup page sent 
    const body = await request.json();
    const { id, email } = body;

    //Basic guard: if either is missing, reject the request 
    if(!id || !email) {
        return NextResponse.json({error: "Missing id or email"}, {status: 400});
    }

    //create the Profile row in your database 
    const profile = await prisma.profile.create({
        data: {
            //Use the Supabase user id as the Profile id so theyre linked 
            id,
            //Store their email 
            email,
        },
    });

    //Send the new profile back as JSON with a 201 (created) status 
    return NextResponse.json(profile, {status:201});
}
