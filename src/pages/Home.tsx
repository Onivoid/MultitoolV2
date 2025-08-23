import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { Download, Brush, Users, Globe2, FileText, AlertTriangle } from 'lucide-react';
import RecentPatchNotes from '@/components/custom/recent-patchnotes';

function Home() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01],
            }}
            className="flex w-full h-full flex-col gap-4 p-2 pr-3"
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="bg-background/40 lg:col-span-2">
                    <CardContent className="pt-6">
                        <h1 className="text-3xl font-bold">Bienvenue dans Multitool V2</h1>
                        <p className="text-muted-foreground mt-2">
                            Outils pour Star Citizen: traductions, gestion du cache, presets personnages et mises à jour.
                        </p>
                        <Separator className="my-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Link to="/traduction" className="block">
                                <Button variant="secondary" className="w-full justify-start gap-2 hover:scale-[1.01] transition">
                                    <Globe2 className="h-4 w-4" /> Traductions
                                </Button>
                            </Link>
                            <Link to="/cache" className="block">
                                <Button variant="secondary" className="w-full justify-start gap-2 hover:scale-[1.01] transition">
                                    <Brush className="h-4 w-4" /> Gestion du cache
                                </Button>
                            </Link>
                            <Link to="/presets-local" className="block">
                                <Button variant="secondary" className="w-full justify-start gap-2 hover:scale-[1.01] transition">
                                    <Users className="h-4 w-4" /> Persos locaux
                                </Button>
                            </Link>
                            <Link to="/presets-remote" className="block">
                                <Button variant="secondary" className="w-full justify-start gap-2 hover:scale-[1.01] transition">
                                    <Download className="h-4 w-4" /> Persos en ligne
                                </Button>
                            </Link>
                            <Link to="/updates" className="block">
                                <Button variant="secondary" className="w-full justify-start gap-2 hover:scale-[1.01] transition">
                                    <FileText className="h-4 w-4" /> Mises à jour
                                </Button>
                            </Link>
                            <Link to="/patchnotes" className="block">
                                <Button variant="secondary" className="w-full justify-start gap-2 hover:scale-[1.01] transition">
                                    <FileText className="h-4 w-4" /> Patchnotes
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-background/40">
                    <CardContent className="pt-6">
                        <h2 className="text-xl font-semibold">Démarrage rapide</h2>
                        <ul className="mt-3 text-sm text-muted-foreground space-y-2 list-disc list-inside">
                            <li>Ouvrez Traductions pour installer la FR</li>
                            <li>Utilisez Gestion du cache pour libérer de l’espace</li>
                            <li>Parcourez les presets et téléchargez vos favoris</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="bg-background/40">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Information pour les utilisateurs V1
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Si vous venez de Multitool V1, les préférences de traduction V1 ne sont pas compatibles avec la V2.
                            Pour repartir proprement, désinstallez puis réinstallez la traduction via l'onglet de Traductions.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="bg-background/40">
                    <CardHeader>
                        <CardTitle className="text-base">Derniers patchnotes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecentPatchNotes max={3} />
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

export default Home;
