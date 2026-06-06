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
import type { LucideIcon } from "lucide-react";
import { X, Menu } from "lucide-react";

function dockPillClass(active: boolean) {
  return cn("dock-item-pill", active ? "dock-item-pill-active" : "dock-item-pill-idle");
}

function getComponentDisplayName(type: unknown): string | undefined {
  return (type as { displayName?: string })?.displayName;
}

function collectDockDropdownItems(
  children: React.ReactNode,
): React.ReactElement<DockDropdownItemProps>[] {
  const items: React.ReactElement<DockDropdownItemProps>[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const displayName = getComponentDisplayName(child.type);
    if (displayName === "DockDropdownItem") {
      items.push(child as React.ReactElement<DockDropdownItemProps>);
      return;
    }

    if (displayName === "DockDropdownGroup") {
      items.push(
        ...collectDockDropdownItems(
          (child as React.ReactElement<DockDropdownGroupProps>).props.children,
        ),
      );
    }
  });

  return items;
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
                <div className="relative z-10 flex items-center gap-1 px-1">
                  {React.Children.map(children, (child) => {
                    if (!React.isValidElement(child)) return null;

                    if (getComponentDisplayName(child.type) === "DockDivider") {
                      return <DockDivider key={`divider-${child.key ?? ""}`} />;
                    }

                    return React.cloneElement(
                      child as React.ReactElement<
                        DockItemProps | DockIconProps | DockLinkProps
                      >,
                      { renderType: "trigger" },
                    );
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

                        if ((child.type as { displayName?: string }).displayName === "DockIcon") {
                          const props = child.props as DockIconProps;
                          if (!props.href) return null;
                          return (
                            <Link
                              to={props.href}
                              className="text-ui-body flex items-center gap-3 font-medium text-foreground"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {props.icon}
                              {props.ariaLabel ?? props.href}
                            </Link>
                          );
                        }

                        if ((child.type as { displayName?: string }).displayName === "DockLink") {
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
                        if (getComponentDisplayName(child.type) === "DockDivider") {
                          return (
                            <div
                              key={`mobile-divider-${child.key ?? ""}`}
                              className="my-1 h-px bg-primary/15"
                              role="separator"
                            />
                          );
                        }

                        if (getComponentDisplayName(child.type) === "DockItem") {
                          const props = child.props as DockItemProps;
                          return (
                            <div key={props.id ?? props.label} className="flex flex-col gap-4">
                              <span className="text-neutral-500 dark:text-neutral-400 text-lg">
                                {props.label}
                              </span>
                              <div className="flex flex-col gap-4 pl-4 border-l border-neutral-200 dark:border-neutral-800">
                                {React.Children.map(props.children, (subChild) => {
                                  if (!React.isValidElement(subChild)) return null;

                                  if (
                                    getComponentDisplayName(subChild.type) ===
                                    "DockDropdownGroup"
                                  ) {
                                    const groupProps =
                                      subChild.props as DockDropdownGroupProps;
                                    return (
                                      <div
                                        key={groupProps.label}
                                        className="flex flex-col gap-3"
                                      >
                                        <span className="text-ui-caption font-medium text-foreground/55">
                                          {groupProps.label}
                                        </span>
                                        {React.Children.map(
                                          groupProps.children,
                                          (item) => {
                                            if (
                                              !React.isValidElement(item) ||
                                              getComponentDisplayName(item.type) !==
                                                "DockDropdownItem"
                                            ) {
                                              return null;
                                            }
                                            return renderMobileDropdownLink(
                                              item.props as DockDropdownItemProps,
                                              () => setIsMobileMenuOpen(false),
                                            );
                                          },
                                        )}
                                      </div>
                                    );
                                  }

                                  if (
                                    getComponentDisplayName(subChild.type) ===
                                    "DockDropdownItem"
                                  ) {
                                    return renderMobileDropdownLink(
                                      subChild.props as DockDropdownItemProps,
                                      () => setIsMobileMenuOpen(false),
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

  const isAnyChildActive = collectDockDropdownItems(children).some(
    (child) => child.props.href && activePage === child.props.href,
  );

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
        <div className="relative z-10 flex w-full min-w-[min(100%,28rem)] items-start justify-between px-4 pb-6 pt-4">
          <div className="flex min-w-[15rem] flex-col">{children}</div>
          <DockItemImagePreview>{children}</DockItemImagePreview>
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      className={cn(
        "text-ui-body flex h-[42px] cursor-pointer items-center gap-1 rounded-full px-[18px] leading-snug text-foreground",
        dockPillClass(isOpen || isAnyChildActive),
        (isOpen || isAnyChildActive) && "font-medium",
        className,
      )}
      onMouseEnter={() => handleDropdownEnter(itemId)}
      onMouseLeave={() => handleDropdownLeave(itemId)}
      transition={{ duration: 0.2 }}
      role="button"
      aria-expanded={isOpen}
      aria-haspopup="true"
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

  const dropdownItems = collectDockDropdownItems(children);

  const activeChild = dropdownItems.find(
    (child) => child.props.href && activePage === child.props.href,
  );

  const hoveredChild = dropdownItems.find(
    (child) => child.props.href === hoveredLink,
  );

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
  description?: string;
  icon?: LucideIcon;
  image?: string;
  className?: string;
}

export const DockDropdownItem = ({
  href,
  label,
  description,
  icon: Icon,
  className,
}: DockDropdownItemProps) => {
  const { hoveredLink, setHoveredLink, activePage } = useDock();

  const isMenuItemActive = activePage === href;
  const isHovered = hoveredLink === href;
  const active = isMenuItemActive || isHovered;

  return (
    <m.div whileHover={{ x: 4 }} transition={{ duration: 0.1 }}>
      <Link
        to={href}
        onMouseEnter={() => setHoveredLink(href)}
        className={cn(
          "flex min-h-10 items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          active
            ? "bg-primary/15 font-medium text-foreground ring-1 ring-primary/25"
            : "text-foreground/90 hover:bg-primary/8 hover:text-foreground",
          className,
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "mt-0.5 size-[18px] shrink-0 stroke-[2.25]",
              active ? "text-foreground" : "text-foreground/95",
            )}
            aria-hidden
          />
        )}
        <span className="min-w-0">
          <span className="text-ui-body block font-medium leading-snug">{label}</span>
          {description && (
            <span className="text-ui-secondary mt-0.5 block leading-snug text-foreground/75">
              {description}
            </span>
          )}
        </span>
      </Link>
    </m.div>
  );
};
DockDropdownItem.displayName = "DockDropdownItem";

interface DockDropdownGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function DockDropdownGroup({
  label,
  children,
  className,
}: DockDropdownGroupProps) {
  return (
    <div className={cn("dock-dropdown-group flex flex-col gap-0.5", className)}>
      <span className="dock-dropdown-group-label">{label}</span>
      {children}
    </div>
  );
}
DockDropdownGroup.displayName = "DockDropdownGroup";

export function DockDivider() {
  return (
    <div
      className="dock-bar-divider mx-1 shrink-0 self-center"
      role="separator"
      aria-orientation="vertical"
    />
  );
}
DockDivider.displayName = "DockDivider";

function renderMobileDropdownLink(
  subProps: DockDropdownItemProps,
  onNavigate: () => void,
) {
  const Icon = subProps.icon;
  return (
    <Link
      key={subProps.href}
      to={subProps.href}
      className="flex min-h-10 items-start gap-3 rounded-lg px-1 py-1.5 text-foreground transition-colors hover:bg-primary/10"
      onClick={onNavigate}
    >
      {Icon && (
        <Icon className="mt-0.5 size-[18px] shrink-0 text-foreground stroke-[2.25]" />
      )}
      <span className="min-w-0">
        <span className="text-ui-body block font-medium">{subProps.label}</span>
        {subProps.description && (
          <span className="text-ui-secondary block text-foreground/75">
            {subProps.description}
          </span>
        )}
      </span>
    </Link>
  );
}

interface DockIconProps {
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  ariaLabel?: string;
  renderType?: "content" | "trigger";
  className?: string;
}

export const DockIcon = ({
  icon,
  href,
  onClick,
  isActive: isActiveProp,
  ariaLabel,
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
      aria-label={ariaLabel}
    >
      {icon}
    </m.div>
  );

  if (onClick) {
    return inner;
  }

  if (href) {
    return (
      <Link to={href} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
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
    "text-ui-body flex h-[42px] items-center gap-1 rounded-full px-[18px] leading-snug text-foreground transition-colors duration-200",
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
