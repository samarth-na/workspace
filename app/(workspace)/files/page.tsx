import { Suspense } from "react";

import { FilesView } from "@/components/views/files-view";

export default function FilesPage() {
  return (
    <Suspense>
      <FilesView />
    </Suspense>
  );
}
