import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold">Protected Page</h1>

      <p className="text-lg">
        Welcome, <span className="font-semibold">{session.user.name}</span>!
      </p>

      <p className="text-gray-600">
        This page is only visible to authenticated users.
      </p>

      <Link href="/" className="text-blue-500 underline hover:text-blue-700">
        Back to Home
      </Link>
    </div>
  );
}
