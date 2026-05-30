import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER } from "@/shared/components/pageStyles";
import logoDark from "@/assets/svg/logo-w.svg";
import logoLight from "@/assets/svg/logo-b.svg";

export default function HomePage() {

  return (
    <PageMotion className={PAGE_CENTER}>
      <div className="flex flex-col items-center gap-5">
        <img
          src={logoDark}
          alt="Multitool"
          className="hidden h-44 w-44 select-none dark:block drop-shadow-xl"
          draggable={false}
        />
        <img
          src={logoLight}
          alt="Multitool"
          className="h-44 w-44 select-none dark:hidden drop-shadow-xl"
          draggable={false}
        />
      </div>
    </PageMotion>
  );
}
