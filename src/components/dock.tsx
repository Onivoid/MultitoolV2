import { cn } from "@/lib/utils";

import {
  easeIn,
  easeOut,
  LazyMotion,
  domAnimation,
  m,
  AnimatePresence,
} from "motion/react";
import { Link } from "react-router-dom";
import React, { useState, useRef, createContext, useContext, useEffect } from "react";
import { X, Menu } from "lucide-react";

function dockPillClass(active: boolean) {
  return cn("dock-item-pill", active ? "dock-item-pill-active" : "dock-item-pill-idle");
}

// Context to manage dock state
interface DockContextType {
  openDropdowns: Record<string, boolean>;
  hoveredLink: string | null;
  setHoveredLink: (href: string | null) => void;
  handleDropdownEnter: (id: string) => void;
  handleDropdownLeave: (id: string) => void;
  activePage?: string;
}

const DockContext = createContext<DockContextType | undefined>(undefined);

const useDock = () => {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error("useDock must be used within a Dock component");
  }
  return context;
};

interface DockProps {
  children: React.ReactNode;
  closeDelay?: number;
  bottomOffset?: string;
  activePage?: string;
  className?: string;
  navClassName?: string;
  /** Dock ancré dans la bande basse de l’app (pas en fixed viewport). */
  embedded?: boolean;
}

export const Dock = ({
  children,
  closeDelay = 100,
  bottomOffset = "60px",
  activePage,
  className,
  navClassName,
  embedded = false,
}: DockProps) => {
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const closeTimeoutsRef = useRef<Record<string, NodeJS.Timeout | null>>({});
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleDropdownEnter = (id: string): void => {
    if (closeTimeoutsRef.current[id]) {
      clearTimeout(closeTimeoutsRef.current[id]!);
    }
    setOpenDropdowns((prev) => ({ ...prev, [id]: true }));
  };

  const handleDropdownLeave = (id: string): void => {
    closeTimeoutsRef.current[id] = setTimeout(() => {
      setOpenDropdowns((prev) => ({ ...prev, [id]: false }));
      setHoveredLink(null);
    }, closeDelay);
  };

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <LazyMotion features={domAnimation}>
      <DockContext.Provider
        value={{
          openDropdowns,
          hoveredLink,
          setHoveredLink,
          handleDropdownEnter,
          handleDropdownLeave,
          activePage,
        }}
      >
        <div className="pointer-events-none fixed inset-0 z-[100]">
          {/* Desktop Dock */}
          <m.nav
            className={cn(
              embedded
                ? "relative z-50 hidden w-full md:block pointer-events-none"
                : cn(
                    "fixed left-0 w-full z-[100] hidden md:block pointer-events-none",
                    navClassName,
                  ),
            )}
            style={embedded ? undefined : { bottom: bottomOffset }}
          >
            <div className="px-4 flex justify-center pointer-events-auto">
              <m.div
                className={cn(
                  "dock-glass relative flex flex-col items-center justify-center p-[3px]",
                  className,
                )}
                transition={{ duration: 0.2 }}
              >
                {/* Dropdown Contents */}
                {React.Children.map(children, (child) => {
                  if (
                    React.isValidElement(child) &&
                    (child.type as { displayName?: string }).displayName === "DockItem"
                  ) {
                    return React.cloneElement(
                      child as React.ReactElement<DockItemProps>,
                      { renderType: "content" },
                    );
                  }
                  return null;
                })}

                {/* Navigation Items */}
                <div className="relative z-10 flex items-center gap-[3px]">
                  {React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                      return React.cloneElement(
                        child as React.ReactElement<
                          DockItemProps | DockIconProps | DockLinkProps
                        >,
                        { renderType: "trigger" },
                      );
                    }
                    return null;
                  })}
                </div>
              </m.div>
            </div>
          </m.nav>

          {/* Mobile Dock */}
          <div className="md:hidden fixed bottom-8 left-0 w-full z-50 flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-white dark:bg-black z-40 flex flex-col pt-20 px-6 pb-32 overflow-y-auto"
                  >
                    <div className="flex flex-col gap-6">
                      {React.Children.map(children, (child) => {
                        if (!React.isValidElement(child)) return null;

                        // Handle DockLink (Top level links)
                        if ((child.type as any).displayName === "DockLink") {
                          const props = child.props as DockLinkProps;
                          return (
                            <Link
                              to={props.href}
                              className="text-black dark:text-white text-2xl font-medium"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {props.label}
                            </Link>
                          );
                        }

                        // Handle DockItem (Sections with dropdowns)
                        if ((child.type as any).displayName === "DockItem") {
                          const props = child.props as DockItemProps;
                          return (
                            <div className="flex flex-col gap-4">
                              <span className="text-neutral-500 dark:text-neutral-400 text-lg">
                                {props.label}
                              </span>
                              <div className="flex flex-col gap-4 pl-4 border-l border-neutral-200 dark:border-neutral-800">
                                {React.Children.map(props.children, (subChild) => {
                                  if (
                                    React.isValidElement(subChild) &&
                                    (subChild.type as any).displayName ===
                                      "DockDropdownItem"
                                  ) {
                                    const subProps =
                                      subChild.props as DockDropdownItemProps;
                                    return (
                                      <Link
                                        to={subProps.href}
                                        className="text-black dark:text-white text-xl font-medium flex items-center gap-3"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                      >
                                        {subProps.image && (
                                          <img
                                            src={subProps.image}
                                            alt=""
                                            width={32}
                                            height={32}
                                            className="rounded-lg object-cover"
                                          />
                                        )}
                                        {subProps.label}
                                      </Link>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all duration-300 relative z-50",
                  isMobileMenuOpen
                    ? "bg-transparent border border-black dark:border-white text-black dark:text-white"
                    : "bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800",
                )}
              >
                <span className="font-medium text-lg">Menu</span>
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </DockContext.Provider>
    </LazyMotion>
  );
};

interface DockItemProps {
  children: React.ReactNode;
  label: string;
  id?: string;
  renderType?: "content" | "trigger";
  className?: string;
}

export const DockItem = ({
  children,
  label,
  id,
  renderType,
  className,
}: DockItemProps) => {
  const { openDropdowns, handleDropdownEnter, handleDropdownLeave, activePage } =
    useDock();
  const itemId = id || label.toLowerCase().replace(/\s+/g, "-");
  const isOpen = openDropdowns[itemId] || false;

  const isAnyChildActive = React.Children.toArray(children).some((child) => {
    if (
      React.isValidElement<DockDropdownItemProps>(child) &&
      (child.type as { displayName?: string }).displayName === "DockDropdownItem" &&
      child.props.href &&
      activePage
    ) {
      return activePage === child.props.href;
    }
    return false;
  });

  if (renderType === "content") {
    return (
      <m.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isOpen ? 1 : 0,
          height: isOpen ? "auto" : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className={cn(
          "w-full overflow-hidden",
          isOpen ? "pointer-events-auto min-h-[100px]" : "pointer-events-none",
        )}
        onMouseEnter={() => handleDropdownEnter(itemId)}
        onMouseLeave={() => handleDropdownLeave(itemId)}
      >
        <div className="relative z-10 flex w-full min-w-[400px] items-start justify-between px-[15px] pb-[30px] pt-[15px]">
          <div className="gap-[12.5px] flex flex-col">{children}</div>
          <DockItemImagePreview>{children}</DockItemImagePreview>
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      className={cn(
        "flex h-[42px] cursor-pointer items-center gap-1 rounded-full px-[18px] text-[14px] leading-[10px] text-foreground",
        dockPillClass(isOpen || isAnyChildActive),
        (isOpen || isAnyChildActive) && "font-medium",
        className,
      )}
      onMouseEnter={() => handleDropdownEnter(itemId)}
      onMouseLeave={() => handleDropdownLeave(itemId)}
      transition={{ duration: 0.2 }}
    >
      {label}
      <m.svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="text-foreground"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 8.93934L4.53033 5.46967L3.46967 6.53033L6.58578 9.64645C7.36683 10.4275 8.63316 10.4275 9.41421 9.64645L12.5303 6.53033L11.4697 5.46967L8 8.93934Z"
          fill="currentColor"
        ></path>
      </m.svg>
    </m.div>
  );
};
DockItem.displayName = "DockItem";

const DockItemImagePreview = ({ children }: { children: React.ReactNode }) => {
  const { hoveredLink, activePage } = useDock();

  const activeChild = React.Children.toArray(children).find((child) => {
    if (
      React.isValidElement<DockDropdownItemProps>(child) &&
      (child.type as { displayName?: string }).displayName === "DockDropdownItem" &&
      child.props.href &&
      activePage
    ) {
      return activePage === child.props.href;
    }
    return false;
  }) as React.ReactElement<DockDropdownItemProps> | undefined;

  const hoveredChild = React.Children.toArray(children).find((child) => {
    return (
      React.isValidElement<DockDropdownItemProps>(child) &&
      (child.type as { displayName?: string }).displayName === "DockDropdownItem" &&
      child.props.href === hoveredLink
    );
  }) as React.ReactElement<DockDropdownItemProps> | undefined;

  const displayImage = hoveredChild?.props.image || activeChild?.props.image;
  const shouldShowImage = hoveredLink || activeChild;

  if (!displayImage) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <m.img
        key={displayImage}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: shouldShowImage ? 1 : 0.8,
          scale: shouldShowImage ? 1 : 0.9,
        }}
        transition={{
          ease: shouldShowImage ? easeIn : easeOut,
          duration: 0.2,
        }}
        src={displayImage}
        className="rounded-[15px] w-[80px] h-[80px] object-cover"
        alt=""
      />
    </div>
  );
};

interface DockDropdownItemProps {
  href: string;
  label: string;
  image?: string;
  className?: string;
}

export const DockDropdownItem = ({ href, label, className }: DockDropdownItemProps) => {
  const { hoveredLink, setHoveredLink, activePage } = useDock();

  const isMenuItemActive = activePage === href;
  const isHovered = hoveredLink === href;

  return (
    <m.div whileHover={{ x: 5 }} transition={{ duration: 0.1 }}>
      <Link
        to={href}
        onMouseEnter={() => setHoveredLink(href)}
        className={cn(
          "block text-[14px] leading-[10px] transition-colors",
          isMenuItemActive || isHovered
            ? "font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground",
          className,
        )}
      >
        {label}
      </Link>
    </m.div>
  );
};
DockDropdownItem.displayName = "DockDropdownItem";

interface DockIconProps {
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  renderType?: "content" | "trigger";
  className?: string;
}

export const DockIcon = ({
  icon,
  href,
  onClick,
  isActive: isActiveProp,
  renderType,
  className,
}: DockIconProps) => {
  const { activePage } = useDock();

  if (renderType === "content") return null;

  const isActive = isActiveProp ?? (href !== undefined && activePage === href);

  const inner = (
    <m.div
      className={cn(
        "flex h-[42px] w-[56px] cursor-pointer items-center justify-center rounded-full",
        dockPillClass(isActive),
        className,
      )}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {icon}
    </m.div>
  );

  if (onClick) {
    return inner;
  }

  if (href) {
    return <Link to={href}>{inner}</Link>;
  }

  return inner;
};
DockIcon.displayName = "DockIcon";

interface DockLinkProps {
  label: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
  renderType?: "content" | "trigger";
  id?: string;
  className?: string;
}

export const DockLink = ({
  label,
  href,
  icon,
  external,
  renderType,
  className,
}: DockLinkProps) => {
  const { activePage } = useDock();
  const [isHovered, setIsHovered] = useState(false);

  if (renderType === "content") return null;

  const isActive = activePage === href;

  const linkContent = (
    <>
      {label}
      {icon && (
        <m.div
          initial={{ x: 0, y: 0 }}
          animate={{
            x: isHovered ? 2 : 0,
            y: isHovered ? -2 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </m.div>
      )}
    </>
  );

  const baseClassName = cn(
    "flex h-[42px] items-center gap-1 rounded-full px-[18px] text-[14px] leading-[10px] text-foreground transition-colors duration-200",
    isActive && "font-medium",
    className,
  );

  if (external) {
    return (
      <m.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseClassName, dockPillClass(isActive))}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        transition={{ duration: 0.2 }}
      >
        {linkContent}
      </m.a>
    );
  }

  return (
    <m.div
      className={cn("inline-block rounded-full", dockPillClass(isActive))}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={href} className={baseClassName}>
        {linkContent}
      </Link>
    </m.div>
  );
};
DockLink.displayName = "DockLink";

export default Dock;
