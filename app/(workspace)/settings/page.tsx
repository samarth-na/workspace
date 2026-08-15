import { redirect } from "next/navigation";

import { WorkspaceSettings } from "@/components/settings/workspace-settings";
import { getSessionWorkspace } from "@/lib/workspace-data";

export default async function SettingsPage() {
  const context = await getSessionWorkspace();
  if (!context) {
    redirect("/sign-in");
  }
  return (
    <WorkspaceSettings
      initialName={context.workspaceName}
      initialLogo={context.workspaceLogo}
      isAdmin={context.isAdmin}
      role={context.role}
    />
  );
}
