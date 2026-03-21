"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tickr-bg px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-serif italic tracking-tight text-tickr-text">tickr</h1>
          <p className="mt-2 text-sm text-tickr-secondary">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-tickr-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-[10px] border border-tickr-border px-3 py-2 text-sm text-tickr-text placeholder:text-tickr-muted focus:border-tickr-text focus:outline-none focus:ring-0"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-tickr-text">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-[10px] border border-tickr-border px-3 py-2 text-sm text-tickr-text placeholder:text-tickr-muted focus:border-tickr-text focus:outline-none focus:ring-0"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-tickr-text">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-[10px] border border-tickr-border px-3 py-2 text-sm text-tickr-text placeholder:text-tickr-muted focus:border-tickr-text focus:outline-none focus:ring-0"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-tickr-text px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-tickr-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-tickr-text hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
