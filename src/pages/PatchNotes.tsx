import { motion } from "framer-motion";
import CommitsList from "@/components/custom/commit-list";
import PageHeader from "@/components/custom/PageHeader";
import { IconBrandGithub } from "@tabler/icons-react";

export default function PatchNotes() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0, 0.71, 0.2, 1.01] }}
            className="flex w-full h-full flex-col gap-4 p-2 pr-3"
        >
            <PageHeader
                icon={<IconBrandGithub className="h-6 w-6" />}
                title="Patchnotes"
                description="Historique des changements récents"
            />
            <CommitsList />
        </motion.div>
    );
}


