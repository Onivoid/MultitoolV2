import { motion } from 'framer-motion';
import CommitsList from '@/components/custom/commit-list';

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
            className="flex min-h-screen w-full flex-col pl-16 pr-4 pt-14"
            data-tauri-drag-region 
        >
            <CommitsList />
        </motion.div>
    );
}

export default Home;
