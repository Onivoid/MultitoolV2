import type { ReactNode } from "react";
import Layout from "@/components/custom/layout";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return <Layout>{children}</Layout>;
}
