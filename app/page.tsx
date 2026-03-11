import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Tickr</h1>
      <p className="text-lg text-gray-600">AI-native investment research</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-800"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
