import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import { IconBrandGithub } from "@tabler/icons-react";
import CommitsList from "@/features/patchnotes/components/CommitsList";

export default function PatchNotesPage() {
  return (
    <PageMotion className="flex w-full h-full flex-col gap-4 p-2 pr-3">
      <PageHeader
        icon={<IconBrandGithub className="h-6 w-6" />}
        title="Patchnotes"
        description="Historique des changements récents"
      />
      <CommitsList />
    </PageMotion>
  );
}
