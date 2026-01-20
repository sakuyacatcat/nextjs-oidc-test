import { auth } from "@/auth";
import { AuthButton } from "@/components/authButton";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold">Next.js + Keycloak OIDC</h1>

      <AuthButton />

      {session?.user && (
        <div className="rounded border p-4">
          <h2 className="mb-2 font-semibold">Session Info:</h2>
          <pre className="text-sm">{JSON.stringify(session, null, 2)}</pre>
        </div>
      )}

      <Link
        href="/protected"
        className="text-blue-500 underline hover:text-blue-700"
      >
        Go to Protected Page
      </Link>
    </div>
  );
}
