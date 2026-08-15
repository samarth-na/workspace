import { headers } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";
import { auth } from "@/lib/auth";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <AppShell
      userName={session?.user.name ?? "Samarth"}
      isSignedIn={Boolean(session)}
    >
      {children}
    </AppShell>
  );
}
