import { motion } from "framer-motion";
import CommitsList from "@/components/custom/commit-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatchNotes() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0, 0.71, 0.2, 1.01] }}
            className="flex w-full h-full flex-col gap-4 p-2 pr-3"
        >
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Patchnotes</h1>
            </div>
            <Card className="bg-background/40 h-[calc(100vh-130px)] flex flex-col">
                <CardHeader>
                    <CardTitle className="text-base text-muted-foreground">
                        Historique des changements récents
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CommitsList />
                </CardContent>
            </Card>
        </motion.div>
    );
}


