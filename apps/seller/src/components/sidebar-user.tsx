import { useClerk, useUser } from "@clerk/clerk-react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@saascription/ui";

function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "…";
}

export function SidebarUser() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const name = user?.fullName?.trim() || email || "Account";

  return (
    <div className="flex items-center gap-2 rounded-md p-2">
      <Avatar className="size-9 shrink-0 border border-sidebar-border">
        <AvatarImage src={user?.imageUrl} alt={name} />
        <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
          {initials(user?.fullName ?? null, email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {name}
        </p>
        {email && name !== email ? (
          <p className="truncate text-[0.625rem] text-muted-foreground">
            {email}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-sidebar-foreground"
        aria-label="Sign out"
        onClick={() => {
          void signOut({ redirectUrl: "/sign-in" });
        }}
      >
        <HugeiconsIcon icon={Logout01Icon} className="size-4" />
      </Button>
    </div>
  );
}
