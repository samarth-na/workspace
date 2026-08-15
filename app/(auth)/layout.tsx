import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#fafbfc] px-4 py-10">
      <div className="fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-[#eef1f8] to-transparent" />
      <div className="relative flex w-full justify-center">{children}</div>
    </div>
  );
}
