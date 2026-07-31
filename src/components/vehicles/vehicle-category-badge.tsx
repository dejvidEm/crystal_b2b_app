import { Badge } from "@/components/ui/badge";
import { cn, getVehicleCategoryShortLabel } from "@/lib/utils";
import type { VehicleCategory } from "@/types";

const CATEGORY_STYLES: Record<VehicleCategory, string> = {
  rental: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  staff: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  for_sale: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export function VehicleCategoryBadge({
  category,
  className,
}: {
  category: VehicleCategory;
  className?: string;
}) {
  return (
    <Badge className={cn(CATEGORY_STYLES[category], className)}>
      {getVehicleCategoryShortLabel(category)}
    </Badge>
  );
}
