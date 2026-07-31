import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[8px] border px-2.5 py-0.5 text-xs font-medium transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
