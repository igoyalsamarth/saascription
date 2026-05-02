import { useClerk } from "@clerk/clerk-react";
import {
  Logout01Icon,
  MoreVerticalIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  buttonVariants,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@saascription/ui";
import { useNavigate } from "@tanstack/react-router";

import { type UserMe, useUserMe } from "@/services/user";

function initialsFromProfile(user: UserMe | undefined): string {
  if (!user) {
    return "…";
  }
  const name = user.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

export function SidebarUserMenu() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { data: user, isPending, isError } = useUserMe();

  const displayName = user?.name?.trim() || user?.email || "Account";

  return (
    <div className="flex items-center gap-2 rounded-md p-2">
      <Avatar className="size-9 shrink-0 border border-sidebar-border">
        <AvatarImage src={user?.imageUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
          {isPending ? "…" : initialsFromProfile(user)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {isPending
            ? "Loading…"
            : isError
              ? "Could not load profile"
              : displayName}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "shrink-0 text-sidebar-foreground",
          )}
          aria-label="Account menu"
        >
          <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="min-w-40">
          <DropdownMenuItem
            onClick={() => {
              void navigate({ to: "/settings" });
            }}
          >
            <HugeiconsIcon icon={Settings01Icon} className="size-3.5" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void signOut({ redirectUrl: "/sign-in" });
            }}
          >
            <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
