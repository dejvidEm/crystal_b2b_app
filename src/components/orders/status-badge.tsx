import { Badge } from "@/components/ui/badge";
import { cn, getStatusColorClasses, getStatusLabel } from "@/lib/utils";
import type { RequestStatus } from "@/types";

export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  return (
    <Badge
      className={cn(getStatusColorClasses(status), className)}
      aria-label={`Stav: ${getStatusLabel(status)}`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
