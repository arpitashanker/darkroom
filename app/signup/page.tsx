"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSignup() {
    setError("");
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signupError) {
      setError(signupError.message);
      return;
    }
    const user = data.user;
    if (user) {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, email: user.email }),
      });
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="max-w-sm w-full p-6 space-y-4">
        <h1 className="text-3xl font-bold text-sky-900 font-serif">Create your account</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-md p-2 focus:border-sky-500 focus:outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-md p-2 focus:border-sky-500 focus:outline-none"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleSignup}
          className="w-full bg-sky-500 text-white rounded-md p-2 hover:bg-sky-600 transition-colors"
        >
          Sign up
        </button>

        <p className="text-sm text-slate-500 text-center">
          Have an account?{" "}
          <a href="/login" className="text-sky-600 hover:text-sky-700">Log in</a>
        </p>
      </div>
    </div>
  );
}
