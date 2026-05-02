import { Button } from "@saascription/ui";
import { useTheme } from "next-themes";

/** Explicit Light / Dark / System — matches next-themes `setTheme` API. */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const active = theme ?? "system";

  return (
    <fieldset className="m-0 flex flex-wrap items-center gap-1 border-0 p-0">
      <legend className="sr-only">Color theme</legend>
      <Button
        type="button"
        variant={active === "light" ? "secondary" : "outline"}
        size="sm"
        onClick={() => setTheme("light")}
      >
        Light
      </Button>
      <Button
        type="button"
        variant={active === "dark" ? "secondary" : "outline"}
        size="sm"
        onClick={() => setTheme("dark")}
      >
        Dark
      </Button>
      <Button
        type="button"
        variant={active === "system" ? "secondary" : "outline"}
        size="sm"
        onClick={() => setTheme("system")}
      >
        Auto
      </Button>
    </fieldset>
  );
}
