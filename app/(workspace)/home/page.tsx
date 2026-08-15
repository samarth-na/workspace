import { HomeView } from "@/components/views/home-view";
import { getSessionUser } from "@/lib/chat-data";
import { fetchHomeData } from "@/lib/home-data";
import { getSessionWorkspace } from "@/lib/workspace-data";

export default async function HomePage() {
  const self = await getSessionUser();
  const context = await getSessionWorkspace();
  if (!self || !context) return null;

  const data = await fetchHomeData(self.id, context.workspaceId);

  return (
    <HomeView
      userName={self.name}
      workspaceName={context.workspaceName}
      {...data}
    />
  );
}
