import { MapPin } from "lucide-react";
import { BlueprintMetaBadge } from "@/features/blueprints/components/BlueprintMetaBadge";
import { systemBadgeClass } from "@/features/blueprints/blueprints.location-colors";
import { cn } from "@/lib/utils";

export interface SystemBadgeProps {
  name: string;
  className?: string;
}

export function SystemBadge({ name, className }: SystemBadgeProps) {
  return (
    <BlueprintMetaBadge
      variant="system"
      icon={MapPin}
      className={cn(systemBadgeClass(name), className)}
    >
      {name}
    </BlueprintMetaBadge>
  );
}
