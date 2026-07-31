import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_SHORT_NAME } from "@/config/constants";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZE_MAP = {
  sm: { height: 28, width: 20 },
  md: { height: 36, width: 26 },
  lg: { height: 48, width: 34 },
} as const;

export function Logo({
  className,
  showWordmark = true,
  size = "md",
}: LogoProps) {
  const dims = SIZE_MAP[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/crystal-logo-white.png"
        alt="Crystal Detailing"
        width={dims.width}
        height={dims.height}
        className="shrink-0 object-contain"
        style={{ height: dims.height, width: "auto" }}
        unoptimized
        priority
      />
      {showWordmark ? (
        <div className="leading-tight">
          <p
            className={cn(
              "font-semibold tracking-tight text-text",
              size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base",
            )}
          >
            Crystal
          </p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            {APP_SHORT_NAME}
          </p>
        </div>
      ) : null}
    </div>
  );
}
