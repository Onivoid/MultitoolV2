import { useRef } from "react";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER } from "@/shared/components/pageStyles";
import logoDark from "@/assets/svg/logo-w.svg";
import logoLight from "@/assets/svg/logo-b.svg";
import { HomeDashboard } from "@/features/home/dashboard/components/HomeDashboard";

export default function HomePage() {
  const logoRef = useRef<HTMLDivElement>(null);

  return (
    <PageMotion entrance="fade" className={`${PAGE_CENTER} relative`}>
      <div ref={logoRef} className="relative z-0 flex flex-col items-center gap-5">
        <img
          src={logoDark}
          alt="Multitool"
          className="hidden h-44 w-44 select-none drop-shadow-xl dark:block"
          draggable={false}
        />
        <img
          src={logoLight}
          alt="Multitool"
          className="h-44 w-44 select-none drop-shadow-xl dark:hidden"
          draggable={false}
        />
      </div>

      <HomeDashboard logoRef={logoRef} />
    </PageMotion>
  );
}
