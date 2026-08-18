import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PostHogIdentity } from "@/components/analytics/posthog-identity";
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
    <>
      <PostHogIdentity
        userId={session.user.id}
        name={session.user.name}
        email={session.user.email}
      />
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
    </>
  );
}
