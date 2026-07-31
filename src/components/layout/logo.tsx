import { cn } from "@/lib/utils";
import { APP_SHORT_NAME } from "@/config/constants";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Logo({
  className,
  showWordmark = true,
  size = "md",
}: LogoProps) {
  const markSize = size === "sm" ? 28 : size === "lg" ? 44 : 34;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="10"
          stroke="currentColor"
          strokeOpacity="0.2"
          className="text-accent"
        />
        <path
          d="M24 8L38 16.5V31.5L24 40L10 31.5V16.5L24 8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-accent"
        />
        <path
          d="M24 16L31 20.2V28.8L24 33L17 28.8V20.2L24 16Z"
          fill="currentColor"
          className="text-accent"
          fillOpacity="0.85"
        />
      </svg>
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
