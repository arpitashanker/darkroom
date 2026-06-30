"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) {
      setError(loginError.message);
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="max-w-sm w-full p-6 space-y-4">
        <h1 className="text-3xl font-bold text-sky-900 font-serif">Log in</h1>

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
          onClick={handleLogin}
          className="w-full bg-sky-500 text-white rounded-md p-2 hover:bg-sky-600 transition-colors"
        >
          Log in
        </button>

        <p className="text-sm text-slate-500 text-center">
          No account?{" "}
          <a href="/signup" className="text-sky-600 hover:text-sky-700">Sign up</a>
        </p>
      </div>
    </div>
  );
}
