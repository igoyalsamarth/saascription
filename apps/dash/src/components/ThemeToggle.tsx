import {
  ComputerIcon,
  Moon01Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@saascription/ui";
import { useTheme } from "next-themes";
import { useId } from "react";

const SEGMENTS = [
  {
    theme: "light" as const,
    label: "Light",
    icon: Sun01Icon,
  },
  {
    theme: "dark" as const,
    label: "Dark",
    icon: Moon01Icon,
  },
  {
    theme: "system" as const,
    label: "System",
    icon: ComputerIcon,
  },
];

type ThemeToggleProps = {
  className?: string;
};

/** Light / Dark / System — segmented control aligned with next-themes `setTheme`. */
export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const active = theme ?? "system";
  const legendId = useId();

  return (
    <fieldset className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend id={legendId} className="sr-only">
        Color theme
      </legend>
      <div
        className={cn(
          "flex rounded-lg bg-muted/80 p-0.5 ring-1 ring-border/60",
          "dark:bg-muted/50 dark:ring-border",
        )}
        role="radiogroup"
        aria-labelledby={legendId}
      >
        {SEGMENTS.map(({ theme: value, label, icon }) => {
          const isOn = active === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isOn}
              aria-label={label}
              className={cn(
                "flex min-h-8 min-w-8 flex-1 items-center justify-center rounded-md transition-[color,box-shadow,background-color]",
                "focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                isOn
                  ? "bg-background text-foreground shadow-sm dark:bg-background/90"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setTheme(value)}
            >
              <HugeiconsIcon
                icon={icon}
                className="size-4 shrink-0"
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
