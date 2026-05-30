import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import { IconBrandGithub } from "@tabler/icons-react";
import CommitsList from "@/features/patchnotes/components/CommitsList";

export default function PatchNotesPage() {
  return (
    <PageMotion className="gap-4 px-4 pt-2">
      <PageHeader
        icon={<IconBrandGithub className="h-6 w-6" />}
        title="Patchnotes"
        description="Historique des changements récents"
      />
      <CommitsList />
    </PageMotion>
  );
}
