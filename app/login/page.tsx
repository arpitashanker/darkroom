// Browser-side component (state + clicks)
"use client";

// React state hook
import { useState } from "react";
// Router for redirecting after login
import { useRouter } from "next/navigation";
// Our browser Supabase client
import { createClient } from "@/utils/supabase/client";

// The page rendered at /login
export default function LoginPage() {
  // Make a Supabase client for this component
  const supabase = createClient();
  // Get the router for navigation
  const router = useRouter();

  // Email field state
  const [email, setEmail] = useState("");
  // Password field state
  const [password, setPassword] = useState("");
  // Error message state
  const [error, setError] = useState("");

  // Runs when the user clicks "Log in"
  async function handleLogin() {
    // Clear previous errors
    setError("");

    // Ask Supabase to sign the user in with email + password
    const { error: loginError } = await supabase.auth.signInWithPassword({
      // Email typed by the user
      email,
      // Password typed by the user
      password,
    });

    // If login failed, show the message and stop
    if (loginError) {
      // Display the error
      setError(loginError.message);
      // Stop here
      return;
    }

    // Login succeeded — send them to their board
    router.push("/board");
  }

  // The markup
  return (
    // Centered container
    <div className="max-w-sm mx-auto mt-20 p-6 space-y-4">
      {/* Heading */}
      <h1 className="text-2xl font-bold">Log in</h1>

      {/* Email input, controlled by state */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded p-2"
      />

      {/* Password input, controlled by state */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded p-2"
      />

      {/* Conditional error line */}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Login button */}
      <button
        onClick={handleLogin}
        className="w-full bg-black text-white rounded p-2"
      >
        Log in
      </button>
    </div>
  );
}