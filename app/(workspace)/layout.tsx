import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { auth } from "@/lib/auth";
import { getSessionWorkspace } from "@/lib/workspace-data";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const context = await getSessionWorkspace();

  return (
    <AppShell
      userName={session.user.name}
      userImage={session.user.image ?? null}
      isSignedIn
      workspaceName={context?.workspaceName ?? "Workspace"}
      workspaceLogo={context?.workspaceLogo ?? null}
      isWorkspaceAdmin={context?.isAdmin ?? false}
    >
      {children}
    </AppShell>
  );
}
