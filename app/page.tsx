import { headers } from "next/headers";
import { WorkspaceShell } from "@/components/workspace-shell";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <WorkspaceShell
      userName={session?.user.name ?? "Samarth"}
      isSignedIn={Boolean(session)}
    />
  );
}
