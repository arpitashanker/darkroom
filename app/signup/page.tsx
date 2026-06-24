//Browser-side component because it uses state and handles clicks
"use client";

//Import React's state hook for tracking input values 
import { useState } from "react"; 
//Import the router so we can send the user to another page after signup 
import { useRouter } from "next/navigation" //how do i know where is from??
//Import our browser Supabase client from Step 3
import { createClient } from "@/utils/supabase/client";

//Default export: the page React renders as the /signup URL 
export default function SignupPage(){
    //Create a Supabase client instance for this component 
    const supabase = createClient();
    //get the router instance so we can navigate programically 
    const router = useRouter();
    
    //state to hold what the user types in the email box (starts empty)
    const [email, setEmail] = useState("");
    //state to hold the password (starts empty)
    const[password, setPassword] = useState("")
    //state to hold any error message to show the user (starts empty)
    const[error, setError] = useState("")

    //Function that runs when the user clicks "Sign Up"
    async function handleSignup(){
        setError("");//clear any old error befor trying again

        //Ask supabase to create a new account with the email and password 
        const {data, error: signupError } = await supabase.auth.signUp({
            //the email the user typed
            email,
            //the password the user typed
            password,
        });

        //IF supabase returned an error, show it and stop here 
        if(signupError)
        {
            //Put the error text into state so it renders on screen 
            setError(signupError.message)
            //exit the function early
            return;
        }

        //Grab the new users unique ID and email so we can make their profile row 
        const user = data.user;
        //only proceed if a user object actually came back
        if (user){
            //Call our own API route to create the profile row 
            await fetch("/api/profile", {
                //use POSt because were creating something 
                method: "POST",
                //Tell the server were sending JSON 
                headers: {"Content-Type": "application/json"},
                //Send the users id and email as the request body 
                body: JSON.stringify({ id: user.id, email: user.email}),
            });
        //Send the user to the board now that their account exists 
        router.push("/board");
        }
    }
        //The JSX (HTML-like markup) this page renders
        return(
            //a centered container with padding and a max width 
            <div className= "max-w-sm mx-auto mt-20 p-6 space-y-4">
              {/* Page heading */}
              <h1 className= "text-2xl font-bold"> Create your account </h1>
              
              {/* Email input box */}
              <input
              //Marks this as an email field (gives mobile keyboards the @ key)
              type = "email"
              //placeholder text shown when empty
              placeholder="Email"
              //the input's value is always driven by our state (controlled input)
              value={email}
              //On every keystroke, update the email state with the new text 
              onChange={(e) => setEmail(e.target.value)}
              //Basic Tailwind styling 
              className="w-full border rounded p-2"
              />
              
              {/* Password input box */}
              <input
              //type="password" hides the characters as dots 
              type = "password"
              //placeholder text
              placeholder= "Password"
              //the inputs value is driven by the password state 
              value={password}
              //Update password state on every keystroke
              onChange={(e) => setPassword(e.target.value)}
              //Same styling as the email box 
              className="w-full border rounded p-2"
              />
              {/* Only render this red error line if error state is non empty */}
              {error && <p className="text-red-600 text-sm"> {error}</p>}
              
              {/* The button that triggers signup */ }
              <button 
              //Run handleSignup when clicked 
              onClick={handleSignup}
              //styling: full width, dark background, white text
              className="w-full bg-black text-white rounded p-2"
              >
                Sign up
              </button>
            </div>
        );
    }
